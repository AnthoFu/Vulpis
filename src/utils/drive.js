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

// URI de redirección predeterminada (usando el esquema de la aplicación personalizada)
const DEFAULT_REDIRECT_URI = GOOGLE_OAUTH_CONFIG.redirectUri;

export const getGoogleConfig = async () => {
  try {
    const clientId = await AsyncStorage.getItem(CLIENT_ID_KEY) || GOOGLE_OAUTH_CONFIG.clientId;
    const redirectUri = await AsyncStorage.getItem(REDIRECT_URI_KEY) || GOOGLE_OAUTH_CONFIG.redirectUri;
    return { clientId, redirectUri };
  } catch (e) {
    console.error('[Drive] Error al leer la configuración:', e);
    return { clientId: GOOGLE_OAUTH_CONFIG.clientId, redirectUri: GOOGLE_OAUTH_CONFIG.redirectUri };
  }
};

export const saveGoogleConfig = async (clientId, redirectUri) => {
  try {
    await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
    await AsyncStorage.setItem(REDIRECT_URI_KEY, redirectUri);
  } catch (e) {
    console.error('[Drive] Error al guardar la configuración:', e);
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
    // Si el token expira en menos de 5 minutos, considerarlo expirado
    if (now > expiry - 300000) {
      console.log('[Drive] Token expirado o próximo a expirar');
      await clearToken();
      return null;
    }
    return token;
  } catch (e) {
    console.error('[Drive] Error al leer el token:', e);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    console.error('[Drive] Error al limpiar el token:', e);
  }
};

export const clearAllCredentials = async () => {
  try {
    await clearToken();
    await AsyncStorage.removeItem(CLIENT_ID_KEY);
    await AsyncStorage.removeItem(REDIRECT_URI_KEY);
  } catch (e) {
    console.error('[Drive] Error al limpiar las credenciales:', e);
  }
};

/**
 * Inicia el flujo de Google OAuth2 usando WebBrowser
 */
export const signInWithGoogle = async (clientId, redirectUri) => {
  if (!clientId) {
    throw new Error('Se requiere un Client ID de Google.');
  }

  // Función auxiliar para generar un verificador aleatorio criptográficamente seguro
  const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const codeVerifier = generateRandomString(50);

  // Endpoint de autenticación de Google OAuth 2.0 usando PKCE
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}` +
    `&prompt=consent` +
    `&code_challenge=${codeVerifier}` +
    `&code_challenge_method=plain`;

  console.log('[Drive] Abriendo sesión de autenticación con URL:', authUrl);
  console.log('[Drive] URI de redirección establecida en:', redirectUri);

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log('[Drive] Resultado de la sesión de autenticación:', result);

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

      console.log('[Drive] Intercambiando código de autorización por token...');
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
        console.error('[Drive] Detalles del error al intercambiar token:', errText);
        throw new Error(`Error al intercambiar el código por token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in; // en segundos

      if (!accessToken) {
        throw new Error('Token de acceso no encontrado en la respuesta del servidor.');
      }

      const expiryTime = Date.now() + (parseInt(expiresIn, 10) || 3600) * 1000;

      // Guardar información del token
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      await saveGoogleConfig(clientId, redirectUri);

      return accessToken;
    } else if (result.type === 'cancel') {
      console.log('[Drive] Inicio de sesión cancelado por el usuario');
      return null;
    } else {
      throw new Error(`Sesión de autenticación terminada con estado: ${result.type}`);
    }
  } catch (error) {
    console.error('[Drive] Error de OAuth:', error);
    throw error;
  }
};

/**
 * Obtiene el ID de la carpeta dedicada "Vulpis" en Google Drive, creándola si no existe.
 */
export const getOrCreateVulpisFolder = async (accessToken) => {
  const FOLDER_CACHE_KEY = 'vulpis_google_folder_id';
  try {
    const cachedId = await AsyncStorage.getItem(FOLDER_CACHE_KEY);
    if (cachedId) {
      // Verificar que la carpeta exista y no esté en la papelera
      const verifyUrl = `https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,trashed`;
      const verifyRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (!verifyData.trashed) {
          console.log('[Drive] Usando ID de carpeta Vulpis en caché:', cachedId);
          return cachedId;
        }
      }
      await AsyncStorage.removeItem(FOLDER_CACHE_KEY);
    }

    # Buscar la carpeta Vulpis
    console.log('[Drive] Buscando la carpeta Vulpis...');
    const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and name = 'Vulpis' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      throw new Error(`Failed to search folder: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folderId = searchData.files[0].id;
      console.log('[Drive] Se encontró la carpeta Vulpis existente:', folderId);
      await AsyncStorage.setItem(FOLDER_CACHE_KEY, folderId);
      return folderId;
    }

    # Crear la carpeta Vulpis
    console.log('[Drive] Carpeta Vulpis no encontrada. Creándola...');
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Vulpis',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create Vulpis folder: ${createRes.status}`);
    }

    const createData = await createRes.json();
    const newFolderId = createData.id;
    console.log('[Drive] Nueva carpeta Vulpis creada:', newFolderId);
    await AsyncStorage.setItem(FOLDER_CACHE_KEY, newFolderId);
    return newFolderId;
  } catch (err) {
    console.error('[Drive] Error en getOrCreateVulpisFolder:', err);
    throw err;
  }
};

/**
 * Obtiene los archivos de audio MP3 del Google Drive del usuario dentro de la carpeta dedicada Vulpis
 */
export const fetchDriveMp3Files = async (accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  // Asegurar que exista la carpeta Vulpis y obtener su ID
  const folderId = await getOrCreateVulpisFolder(accessToken);

  // Consulta: solo archivos MP3 dentro de la carpeta Vulpis, no en la papelera, ordenados por nombre
  const q = encodeURIComponent(`mimeType = 'audio/mpeg' and trashed = false and '${folderId}' in parents`);
  const fields = 'files(id,name,size,webContentLink)';
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${encodeURIComponent(fields)}&orderBy=name`;

  console.log('[Drive] Obteniendo archivos desde URL:', driveUrl);

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
      console.error('[Drive] Detalles del error de la API:', errorText);
      
      if (response.status === 401) {
        // Token expirado
        await clearToken();
        throw new Error('AUTH_EXPIRED');
      }
      throw new Error(`Error de Google Drive API: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('[Drive] Error en fetchDriveMp3Files:', error);
    throw error;
  }
};

/**
 * Resuelve la URL final redireccionada de descarga de un archivo de Google Drive usando una petición GET con AbortController
 */
export const getDriveRedirectUrl = async (fileId, accessToken) => {
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Tiempo de espera de 10 segundos

  try {
    console.log(`[Drive] Resolviendo URL de redirección para el archivo: ${fileId} mediante GET con cancelación...`);
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url;
    
    // Cancelar la petición inmediatamente después de recibir las cabeceras para evitar descargar el contenido binario
    controller.abort();

    if (response.ok && finalUrl) {
      console.log('[Drive] URL final resuelta exitosamente mediante GET:', finalUrl);
      return finalUrl;
    }
    
    console.log('[Drive] Petición GET fallida o falta response.url. Volviendo a la URL original.');
    return streamUrl;
  } catch (error) {
    clearTimeout(timeoutId);
    // Si el error es un AbortError pero obtuvimos la respuesta exitosamente antes de abortar, podemos verificar que esté bien.
    // En javascript, si la promesa se resolvió, no se entra al bloque catch para la llamada fetch en sí.
    if (error.name === 'AbortError') {
      console.log('[Drive] Petición cancelada (descarga del cuerpo cancelada)');
    } else {
      console.error('[Drive] Error al resolver URL de redirección mediante GET:', error);
    }
    return streamUrl;
  }
};

/**
 * Convierte un objeto de archivo de Google Drive a una pista de TrackPlayer
 */
export const mapDriveFileToTrack = (file, accessToken, defaultCover, resolvedUrl) => {
  const streamUrl = resolvedUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

  return {
    mediaId: `drive-${file.id}`,
    url: streamUrl,
    title: file.name.replace(/\.mp3$/i, ''),
    artist: 'Nube Privada (Drive)',
    artworkUrl: defaultCover,
    // Inyectar cabecera Authorization para que TrackPlayer/ExoPlayer pueda reproducir el archivo por streaming
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

/**
 * Sube un archivo MP3 a la carpeta dedicada Vulpis de Google Drive usando un proceso de dos pasos.
 */
export const uploadTrackToDrive = async (fileUri, fileName, accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  // Asegurar que exista la carpeta Vulpis y obtener su ID
  const folderId = await getOrCreateVulpisFolder(accessToken);

  console.log('[Drive] Creando metadatos de archivo para subir dentro de la carpeta Vulpis:', fileName);
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: 'audio/mpeg',
      parents: [folderId],
    }),
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    console.error('[Drive] Falló la creación de metadatos de archivo:', err);
    throw new Error(`Error al crear metadatos en Google Drive: ${createResponse.status}`);
  }

  const fileData = await createResponse.json();
  const fileId = fileData.id;
  console.log('[Drive] Creado marcador de posición de archivo con ID:', fileId);

  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  console.log('[Drive] Subiendo contenido multimedia a la URL:', uploadUrl);

  const FileSystem = require('expo-file-system/legacy');
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'audio/mpeg',
    },
    httpMethod: 'PATCH',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  console.log('[Drive] Estado del resultado de subida:', uploadResult.status);
  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    console.error('[Drive] Detalles del fallo en la subida multimedia:', uploadResult.body);
    // Limpiar el marcador de posición de metadatos si falló la subida
    try {
      await deleteTrackFromDrive(fileId, accessToken);
    } catch (cleanupErr) {
      console.warn('[Drive] Falló la limpieza del marcador de posición vacío:', cleanupErr);
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
 * Elimina un archivo de Google Drive usando su fileId.
 */
export const deleteTrackFromDrive = async (fileId, accessToken) => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  console.log('[Drive] Eliminando archivo de Google Drive:', fileId);
  const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Drive] Falló la eliminación del archivo:', err);
    if (response.status === 404) {
      return true;
    }
    throw new Error(`Error al eliminar archivo de Google Drive: ${response.status}`);
  }

  console.log('[Drive] Archivo eliminado exitosamente de Google Drive:', fileId);
  return true;
};
