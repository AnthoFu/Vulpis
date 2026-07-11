import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { GOOGLE_OAUTH_CONFIG } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID_KEY = 'vulpis_google_client_id';
const REDIRECT_URI_KEY = 'vulpis_google_redirect_uri';
const TOKEN_KEY = 'vulpis_google_access_token';
const TOKEN_EXPIRY_KEY = 'vulpis_google_token_expiry';

// Default redirect URI (using the custom app scheme)
const DEFAULT_REDIRECT_URI = GOOGLE_OAUTH_CONFIG.redirectUri;

export const getGoogleConfig = async () => {
  try {
    const clientId = await AsyncStorage.getItem(CLIENT_ID_KEY) || GOOGLE_OAUTH_CONFIG.clientId;
    const redirectUri = await AsyncStorage.getItem(REDIRECT_URI_KEY) || GOOGLE_OAUTH_CONFIG.redirectUri;
    return { clientId, redirectUri };
  } catch (e) {
    console.error('[Drive] Error reading config:', e);
    return { clientId: GOOGLE_OAUTH_CONFIG.clientId, redirectUri: GOOGLE_OAUTH_CONFIG.redirectUri };
  }
};

export const saveGoogleConfig = async (clientId, redirectUri) => {
  try {
    await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
    await AsyncStorage.setItem(REDIRECT_URI_KEY, redirectUri);
  } catch (e) {
    console.error('[Drive] Error saving config:', e);
    throw e;
  }
};

export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiryStr) return null;

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();
    // If token expires in less than 5 minutes, consider it expired
    if (now > expiry - 300000) {
      console.log('[Drive] Token expired or close to expiry');
      await clearToken();
      return null;
    }
    return token;
  } catch (e) {
    console.error('[Drive] Error reading token:', e);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    console.error('[Drive] Error clearing token:', e);
  }
};

export const clearAllCredentials = async () => {
  try {
    await clearToken();
    await AsyncStorage.removeItem(CLIENT_ID_KEY);
    await AsyncStorage.removeItem(REDIRECT_URI_KEY);
  } catch (e) {
    console.error('[Drive] Error clearing credentials:', e);
  }
};

/**
 * Initiates the Google OAuth2 flow using WebBrowser
 */
export const signInWithGoogle = async (clientId, redirectUri) => {
  if (!clientId) {
    throw new Error('Se requiere un Client ID de Google.');
  }

  // Helper to generate cryptographically safe-ish random verifier
  const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const codeVerifier = generateRandomString(50);

  // Google OAuth 2.0 Auth Endpoint using PKCE
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}` +
    `&prompt=consent` +
    `&code_challenge=${codeVerifier}` +
    `&code_challenge_method=plain`;

  console.log('[Drive] Opening Auth Session with URL:', authUrl);
  console.log('[Drive] Redirect URI set to:', redirectUri);

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log('[Drive] Auth Session result:', result);

    if (result.type === 'success' && result.url) {
      const urlStr = result.url;
      let code = null;
      let searchParams = null;
      
      const questionIndex = urlStr.indexOf('?');
      const hashIndex = urlStr.indexOf('#');
      
      if (questionIndex !== -1) {
        const queryStr = hashIndex !== -1 && hashIndex > questionIndex
          ? urlStr.substring(questionIndex + 1, hashIndex)
          : urlStr.substring(questionIndex + 1);
        searchParams = new URLSearchParams(queryStr);
        code = searchParams.get('code');
      }
      
      if (!code && hashIndex !== -1) {
        searchParams = new URLSearchParams(urlStr.substring(hashIndex + 1));
        code = searchParams.get('code');
      }

      if (!code) {
        const error = (searchParams && searchParams.get('error')) || 'Código de autorización no encontrado';
        throw new Error(`Error de Google OAuth: ${error}`);
      }

      console.log('[Drive] Exchanging authorization code for token...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error('[Drive] Token exchange failed details:', errText);
        throw new Error(`Error al intercambiar el código por token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in; // in seconds

      if (!accessToken) {
        throw new Error('Token de acceso no encontrado en la respuesta del servidor.');
      }

      const expiryTime = Date.now() + (parseInt(expiresIn, 10) || 3600) * 1000;

      // Save token info
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      await saveGoogleConfig(clientId, redirectUri);

      return accessToken;
    } else if (result.type === 'cancel') {
      console.log('[Drive] Sign-in cancelled by user');
      return null;
    } else {
      throw new Error(`Sesión de autenticación terminada con estado: ${result.type}`);
    }
  } catch (error) {
    console.error('[Drive] OAuth Error:', error);
    throw error;
  }
};

/**
 * Fetches MP3 audio files from the user's Google Drive
 */
export const fetchDriveMp3Files = async (accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  // Query: MP3 files only, not in trash, ordered by name
  const q = encodeURIComponent("mimeType = 'audio/mpeg' and trashed = false");
  const fields = 'files(id,name,size,webContentLink)';
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${encodeURIComponent(fields)}&orderBy=name`;

  console.log('[Drive] Fetching files from url:', driveUrl);

  try {
    const response = await fetch(driveUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Drive] API error details:', errorText);
      
      if (response.status === 401) {
        // Token expired
        await clearToken();
        throw new Error('AUTH_EXPIRED');
      }
      throw new Error(`Error de Google Drive API: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('[Drive] fetchDriveMp3Files error:', error);
    throw error;
  }
};

/**
 * Resolves the final redirected download URL for a Google Drive file using a GET request with AbortController
 */
export const getDriveRedirectUrl = async (fileId, accessToken) => {
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    console.log(`[Drive] Resolving redirect URL for file: ${fileId} via GET with abort...`);
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url;
    
    // Cancel the request immediately after headers are received to prevent downloading the binary payload
    controller.abort();

    if (response.ok && finalUrl) {
      console.log('[Drive] Resolved final URL successfully via GET:', finalUrl);
      return finalUrl;
    }
    
    console.log('[Drive] GET request failed or response.url is missing. Falling back to original URL.');
    return streamUrl;
  } catch (error) {
    clearTimeout(timeoutId);
    // If the error is an AbortError but we successfully got the response before aborting, we can check if it's fine.
    // In javascript, if the promise resolved, the catch block is not entered for the fetch call itself.
    if (error.name === 'AbortError') {
      console.log('[Drive] Request aborted (body download cancelled)');
    } else {
      console.error('[Drive] Error resolving redirect URL via GET:', error);
    }
    return streamUrl;
  }
};

/**
 * Convert a Google Drive file object to a TrackPlayer track
 */
export const mapDriveFileToTrack = (file, accessToken, defaultCover, resolvedUrl) => {
  const streamUrl = resolvedUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

  return {
    mediaId: `drive-${file.id}`,
    url: streamUrl,
    title: file.name.replace(/\.mp3$/i, ''),
    artist: 'Nube Privada (Drive)',
    artworkUrl: defaultCover,
    // Inject Authorization header so TrackPlayer/ExoPlayer can stream the file
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

/**
 * Uploads an MP3 file to Google Drive using a two-step process to avoid large memory footprints.
 */
export const uploadTrackToDrive = async (fileUri, fileName, accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  console.log('[Drive] Creating file metadata for upload:', fileName);
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: 'audio/mpeg',
    }),
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    console.error('[Drive] Create file metadata failed:', err);
    throw new Error(`Error al crear metadatos en Google Drive: ${createResponse.status}`);
  }

  const fileData = await createResponse.json();
  const fileId = fileData.id;
  console.log('[Drive] File placeholder created with ID:', fileId);

  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  console.log('[Drive] Uploading media to URL:', uploadUrl);

  const FileSystem = require('expo-file-system/legacy');
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'audio/mpeg',
    },
    httpMethod: 'PATCH',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  console.log('[Drive] Upload result status:', uploadResult.status);
  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    console.error('[Drive] Media upload failed details:', uploadResult.body);
    // Cleanup metadata placeholder if upload failed
    try {
      await deleteTrackFromDrive(fileId, accessToken);
    } catch (cleanupErr) {
      console.warn('[Drive] Cleanup of empty placeholder failed:', cleanupErr);
    }
    throw new Error(`Error al subir el archivo de audio: ${uploadResult.status}`);
  }

  const finalData = JSON.parse(uploadResult.body);
  return {
    id: fileId,
    name: finalData.name || fileName,
    mimeType: 'audio/mpeg',
  };
};

/**
 * Deletes a file from Google Drive using its fileId.
 */
export const deleteTrackFromDrive = async (fileId, accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  console.log('[Drive] Deleting file from Google Drive:', fileId);
  const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Drive] Delete file failed:', err);
    if (response.status === 404) {
      return true;
    }
    throw new Error(`Error al eliminar archivo de Google Drive: ${response.status}`);
  }

  console.log('[Drive] File deleted successfully from Google Drive:', fileId);
  return true;
};
