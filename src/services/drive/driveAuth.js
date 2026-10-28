import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_OAUTH_CONFIG } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID_KEY = 'vulpis_google_client_id';
const REDIRECT_URI_KEY = 'vulpis_google_redirect_uri';
const TOKEN_KEY = 'vulpis_google_access_token';
const TOKEN_EXPIRY_KEY = 'vulpis_google_token_expiry';

/**
 * Obtiene la configuración de cliente OAuth (Client ID y Redirect URI) desde AsyncStorage,
 * o recurre a los valores predeterminados de la aplicación.
 *
 * @returns {Promise<{clientId: string, redirectUri: string}>}
 */
export const getGoogleConfig = async () => {
  try {
    const clientId = (await AsyncStorage.getItem(CLIENT_ID_KEY)) || GOOGLE_OAUTH_CONFIG.clientId;
    const redirectUri =
      (await AsyncStorage.getItem(REDIRECT_URI_KEY)) || GOOGLE_OAUTH_CONFIG.redirectUri;
    return { clientId, redirectUri };
  } catch (e) {
    console.error('[DriveAuth] Error al leer la configuración:', e);
    return {
      clientId: GOOGLE_OAUTH_CONFIG.clientId,
      redirectUri: GOOGLE_OAUTH_CONFIG.redirectUri,
    };
  }
};

/**
 * Guarda la configuración de OAuth en AsyncStorage.
 *
 * @param {string} clientId - Client ID de Google Cloud Console.
 * @param {string} redirectUri - Esquema de redirección registrado.
 */
export const saveGoogleConfig = async (clientId, redirectUri) => {
  try {
    await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
    await AsyncStorage.setItem(REDIRECT_URI_KEY, redirectUri);
  } catch (e) {
    console.error('[DriveAuth] Error al guardar la configuración:', e);
    throw e;
  }
};

/**
 * Recupera el token de acceso vigente de Google Drive.
 * Si el token expiró o está a menos de 5 minutos de expirar, se descarta y retorna null.
 *
 * @returns {Promise<string|null>} Token Bearer válido o null si requiere autenticación.
 */
export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiryStr) return null;

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();
    // Si el token expira en menos de 5 minutos, considerarlo expirado
    if (now > expiry - 300000) {
      console.log('[DriveAuth] Token expirado o próximo a expirar');
      await clearToken();
      return null;
    }
    return token;
  } catch (e) {
    console.error('[DriveAuth] Error al leer el token:', e);
    return null;
  }
};

/**
 * Elimina el token de acceso y su marca de tiempo de expiración.
 */
export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    console.error('[DriveAuth] Error al limpiar el token:', e);
  }
};

/**
 * Limpia todas las credenciales persistidas de Google Drive (token y configuración personalizada).
 */
export const clearAllCredentials = async () => {
  try {
    await clearToken();
    await AsyncStorage.removeItem(CLIENT_ID_KEY);
    await AsyncStorage.removeItem(REDIRECT_URI_KEY);
  } catch (e) {
    console.error('[DriveAuth] Error al limpiar las credenciales:', e);
  }
};

/**
 * Inicia el flujo de autorización OAuth 2.0 con Google usando WebBrowser y PKCE (Proof Key for Code Exchange).
 *
 * @param {string} clientId - Client ID de Google OAuth.
 * @param {string} redirectUri - URI de redirección registrada en Google Cloud Console.
 * @returns {Promise<string|null>} Token de acceso obtenido o null si el usuario canceló el flujo.
 */
export const signInWithGoogle = async (clientId, redirectUri) => {
  if (!clientId) {
    throw new Error('Se requiere un Client ID de Google.');
  }

  // Generador de verificador criptográfico aleatorio para PKCE
  const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const codeVerifier = generateRandomString(50);

  // Construcción del endpoint de autorización con scopes de Google Drive
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}` +
    `&prompt=consent` +
    `&code_challenge=${codeVerifier}` +
    `&code_challenge_method=plain`;

  console.log('[DriveAuth] Abriendo sesión de autenticación con URL:', authUrl);
  console.log('[DriveAuth] URI de redirección establecida en:', redirectUri);

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log('[DriveAuth] Resultado de la sesión de autenticación:', result);

    if (result.type === 'success' && result.url) {
      const urlStr = result.url;
      let code = null;
      let searchParams = null;

      const questionIndex = urlStr.indexOf('?');
      const hashIndex = urlStr.indexOf('#');

      if (questionIndex !== -1) {
        const queryStr =
          hashIndex !== -1 && hashIndex > questionIndex
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
        const error =
          (searchParams && searchParams.get('error')) || 'Código de autorización no encontrado';
        throw new Error(`Error de Google OAuth: ${error}`);
      }

      console.log('[DriveAuth] Intercambiando código de autorización por token...');
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
        console.error('[DriveAuth] Detalles del error al intercambiar token:', errText);
        throw new Error(`Error al intercambiar el código por token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in; // en segundos

      if (!accessToken) {
        throw new Error('Token de acceso no encontrado en la respuesta del servidor.');
      }

      const expiryTime = Date.now() + (parseInt(expiresIn, 10) || 3600) * 1000;

      // Guardar información del token en almacenamiento seguro
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      await saveGoogleConfig(clientId, redirectUri);

      return accessToken;
    } else if (result.type === 'cancel') {
      console.log('[DriveAuth] Inicio de sesión cancelado por el usuario');
      return null;
    } else {
      throw new Error(`Sesión de autenticación terminada con estado: ${result.type}`);
    }
  } catch (error) {
    console.error('[DriveAuth] Error de OAuth:', error);
    throw error;
  }
};
