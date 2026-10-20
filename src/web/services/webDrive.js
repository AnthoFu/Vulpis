import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import { getCachedAudioBlob, saveAudioBlob } from './webCache';

const CLIENT_ID_KEY = 'vulpis_web_google_client_id';
const TOKEN_KEY = 'vulpis_web_google_access_token';
const TOKEN_EXPIRY_KEY = 'vulpis_web_google_token_expiry';
const FOLDER_ID_KEY = 'vulpis_web_google_folder_id';

const DEFAULT_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '';

/**
 * Obtiene la configuración guardada de Google Drive para la web.
 */
export const getWebGoogleConfig = () => {
  if (typeof window === 'undefined') return { clientId: DEFAULT_CLIENT_ID };
  const envWebId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const saved = localStorage.getItem(CLIENT_ID_KEY);
  return {
    clientId: envWebId || saved || DEFAULT_CLIENT_ID,
  };
};

/**
 * Guarda el Client ID personalizado de Google.
 */
export const saveWebGoogleConfig = (clientId) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
  }
};

/**
 * Obtiene el token de acceso guardado si sigue siendo válido.
 */
export const getWebStoredToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;

  const now = Date.now();
  if (now > parseInt(expiry, 10) - 60000) {
    // Expirado o a punto de expirar
    clearWebToken();
    return null;
  }
  return token;
};

/**
 * Guarda el token de acceso y su vigencia.
 */
export const saveWebStoredToken = (token, expiresInSeconds = 3600) => {
  if (typeof window !== 'undefined' && token) {
    const expiry = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token.trim());
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }
};

/**
 * Limpia el token y sesión de Drive en la web.
 */
export const clearWebToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
};

/**
 * Carga de forma dinámica la biblioteca de Google Identity Services (GSI) si no está presente.
 */
const loadGoogleGsiScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts.oauth2);
    }
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.accounts.oauth2));
      existingScript.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.accounts.oauth2);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Inicia sesión con Google Drive usando Google Identity Services (GSI) en Web.
 */
export const signInWebWithGoogle = async (customClientId) => {
  const { clientId } = getWebGoogleConfig();
  const effectiveClientId = (customClientId || clientId || '').trim();

  if (!effectiveClientId) {
    throw new Error('Debes configurar un Google Client ID válido para Web.');
  }

  const oauth2 = await loadGoogleGsiScript();

  return new Promise((resolve, reject) => {
    let isSettled = false;

    // Timeout de seguridad por si el usuario cierra el popup de Google o Google bloquea la ventana
    const timeout = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(
          new Error(
            'El proceso de inicio de sesión no se completó a tiempo o la ventana fue cerrada. Verifica que tu Google Client ID sea de tipo "Aplicación web" y tenga agregado el origen http://localhost:8081 en Google Cloud Console.'
          )
        );
      }
    }, 60000); // 60 segundos de margen

    try {
      const client = oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope:
          'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timeout);

          if (response.error) {
            console.error('[WebDrive] Error en autenticación OAuth:', response);
            return reject(
              new Error(
                response.error_description ||
                  `Error de Google: ${response.error}. Asegúrate de que el origen (${typeof window !== 'undefined' ? window.location.origin : ''}) esté autorizado.`
              )
            );
          }
          if (response.access_token) {
            saveWebStoredToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('No se recibió token de acceso de Google.'));
          }
        },
        error_callback: (error) => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timeout);
          console.warn('[WebDrive] Error en GSI Token Client:', error);
          reject(
            new Error(
              error.message ||
                'Error de autorización: Cliente no válido o el origen web no está registrado en Google Cloud Console.'
            )
          );
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeout);
        console.error('[WebDrive] Error al inicializar Token Client:', err);
        reject(err);
      }
    }
  });
};

/**
 * Obtiene o crea la carpeta dedicada "Vulpis" en el Google Drive del usuario.
 */
export const getOrCreateWebVulpisFolder = async (accessToken) => {
  if (typeof window !== 'undefined') {
    const cachedId = localStorage.getItem(FOLDER_ID_KEY);
    if (cachedId) {
      try {
        const verifyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,trashed`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (!verifyData.trashed) return cachedId;
        }
      } catch (_) {}
      localStorage.removeItem(FOLDER_ID_KEY);
    }
  }

  // Buscar carpeta Vulpis
  const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and name = 'Vulpis' and trashed = false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const folderId = searchData.files[0].id;
      if (typeof window !== 'undefined') localStorage.setItem(FOLDER_ID_KEY, folderId);
      return folderId;
    }
  }

  // Crear carpeta si no existe
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
    throw new Error(`Error al crear la carpeta Vulpis: ${createRes.status}`);
  }

  const createData = await createRes.json();
  if (typeof window !== 'undefined') localStorage.setItem(FOLDER_ID_KEY, createData.id);
  return createData.id;
};

/**
 * Obtiene los archivos de audio MP3 de Google Drive.
 * Permite buscar en la carpeta Vulpis o en todo el Drive si la carpeta Vulpis está vacía.
 */
export const fetchWebDriveMp3Files = async (accessToken, searchEntireDrive = false) => {
  if (!accessToken) throw new Error('Token de acceso no válido.');

  let q = "mimeType = 'audio/mpeg' and trashed = false";
  
  if (!searchEntireDrive) {
    try {
      const folderId = await getOrCreateWebVulpisFolder(accessToken);
      q += ` and '${folderId}' in parents`;
    } catch (err) {
      console.warn('[WebDrive] No se pudo acceder a la carpeta Vulpis, buscando en todo el Drive:', err);
    }
  }

  const fields = 'files(id,name,size,webContentLink,createdTime)';
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=name`;

  const response = await fetch(driveUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearWebToken();
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Error de Google Drive API: ${response.status}`);
  }

  const data = await response.json();
  const files = data.files || [];

  // Si buscamos en la carpeta Vulpis y está vacía, intentamos buscar en todo el Drive
  if (files.length === 0 && !searchEntireDrive) {
    console.log('[WebDrive] Carpeta Vulpis vacía. Buscando canciones en todo el Drive...');
    return fetchWebDriveMp3Files(accessToken, true);
  }

  return files;
};

/**
 * Descarga el archivo de audio de Google Drive en memoria / caché del navegador
 * y devuelve un Blob URL listo para reproducir con <audio>.
 */
export const getWebAudioBlobUrl = async (fileId, accessToken, onProgress) => {
  // 1. Revisar caché local en el navegador
  const cachedBlob = await getCachedAudioBlob(fileId);
  if (cachedBlob) {
    return {
      objectUrl: URL.createObjectURL(cachedBlob),
      blob: cachedBlob,
      fromCache: true,
    };
  }

  // 2. Descargar desde la API de Google Drive
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(streamUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearWebToken();
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Error al descargar archivo de audio: ${response.status}`);
  }

  const blob = await response.blob();

  // 3. Guardar en caché web para futuras reproducciones
  await saveAudioBlob(fileId, blob);

  return {
    objectUrl: URL.createObjectURL(blob),
    blob: blob,
    fromCache: false,
  };
};

/**
 * Extrae metadatos ID3 (título, artista, álbum, carátula) desde un Blob en el navegador.
 */
export const extractMetadataFromBlob = (blob, defaultTitle) => {
  return new Promise((resolve) => {
    if (!blob || typeof jsmediatags === 'undefined') {
      return resolve({
        title: defaultTitle,
        artist: 'Google Drive',
        album: 'Nube Privada',
        artwork: null,
      });
    }

    try {
      jsmediatags.read(blob, {
        onSuccess: (tag) => {
          const tags = tag.tags || {};
          let artworkUrl = null;

          if (tags.picture) {
            try {
              const { data, format } = tags.picture;
              let base64String = '';
              for (let i = 0; i < data.length; i++) {
                base64String += String.fromCharCode(data[i]);
              }
              artworkUrl = `data:${format};base64,${btoa(base64String)}`;
            } catch (picErr) {
              console.warn('[WebDrive] Error al decodificar carátula ID3:', picErr);
            }
          }

          resolve({
            title: tags.title || defaultTitle,
            artist: tags.artist || 'Google Drive',
            album: tags.album || 'Nube Privada',
            artwork: artworkUrl,
          });
        },
        onError: () => {
          resolve({
            title: defaultTitle,
            artist: 'Google Drive',
            album: 'Nube Privada',
            artwork: null,
          });
        },
      });
    } catch (_) {
      resolve({
        title: defaultTitle,
        artist: 'Google Drive',
        album: 'Nube Privada',
        artwork: null,
      });
    }
  });
};
