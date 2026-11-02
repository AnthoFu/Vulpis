import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { clearToken } from './driveAuth';
import { Track } from '../../models/Track';

/**
 * Representación de un archivo retornado por la API de Google Drive.
 */
export interface DriveFile {
  id: string;
  name: string;
  size?: string;
  webContentLink?: string;
}

/**
 * Resultado de subir un archivo a Google Drive.
 */
export interface UploadTrackResult {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Obtiene el ID de la carpeta dedicada "Vulpis" en Google Drive, creándola si no existe.
 */
export const getOrCreateVulpisFolder = async (accessToken: string): Promise<string> => {
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
          console.log('[DriveApi] Usando ID de carpeta Vulpis en caché:', cachedId);
          return cachedId;
        }
      }
      await AsyncStorage.removeItem(FOLDER_CACHE_KEY);
    }

    // Buscar la carpeta Vulpis en Drive
    console.log('[DriveApi] Buscando la carpeta Vulpis...');
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
      console.log('[DriveApi] Se encontró la carpeta Vulpis existente:', folderId);
      await AsyncStorage.setItem(FOLDER_CACHE_KEY, folderId);
      return folderId;
    }

    // Crear la carpeta Vulpis si no existe
    console.log('[DriveApi] Carpeta Vulpis no encontrada. Creándola...');
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
    const newFolderId: string = createData.id;
    console.log('[DriveApi] Nueva carpeta Vulpis creada:', newFolderId);
    await AsyncStorage.setItem(FOLDER_CACHE_KEY, newFolderId);
    return newFolderId;
  } catch (err) {
    console.error('[DriveApi] Error en getOrCreateVulpisFolder:', err);
    throw err;
  }
};

/**
 * Obtiene los archivos de audio MP3 del Google Drive del usuario dentro de la carpeta dedicada Vulpis.
 */
export const fetchDriveMp3Files = async (accessToken: string): Promise<DriveFile[]> => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  // Asegurar que exista la carpeta Vulpis y obtener su ID
  const folderId = await getOrCreateVulpisFolder(accessToken);

  // Consulta: solo archivos MP3 dentro de la carpeta Vulpis, no en la papelera, ordenados por nombre
  const q = encodeURIComponent(`mimeType = 'audio/mpeg' and trashed = false and '${folderId}' in parents`);
  const fields = 'files(id,name,size,webContentLink)';
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${encodeURIComponent(fields)}&orderBy=name`;

  console.log('[DriveApi] Obteniendo archivos desde URL:', driveUrl);

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
      console.error('[DriveApi] Detalles del error de la API:', errorText);

      if (response.status === 401) {
        // Token expirado
        await clearToken();
        throw new Error('AUTH_EXPIRED');
      }
      throw new Error(`Error de Google Drive API: ${response.status}`);
    }

    const data = await response.json();
    return (data.files || []) as DriveFile[];
  } catch (error) {
    console.error('[DriveApi] Error en fetchDriveMp3Files:', error);
    throw error;
  }
};

/**
 * Resuelve la URL final redireccionada de un archivo de Google Drive usando una petición GET con AbortController.
 */
export const getDriveRedirectUrl = async (
  fileId: string,
  accessToken: string
): Promise<string> => {
  const streamUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    console.log(`[DriveApi] Resolviendo URL de redirección para el archivo: ${fileId}...`);
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const finalUrl = response.url;

    // Cancelar la petición inmediatamente después de recibir las cabeceras para evitar descargar el cuerpo binario
    controller.abort();

    if (response.ok && finalUrl) {
      console.log('[DriveApi] URL final resuelta exitosamente:', finalUrl);
      return finalUrl;
    }

    return streamUrl;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      console.log('[DriveApi] Petición cancelada (descarga del cuerpo cancelada tras cabecera)');
    } else {
      console.error('[DriveApi] Error al resolver URL de redirección:', error);
    }
    return streamUrl;
  }
};

/**
 * Convierte un objeto de archivo de Google Drive al modelo Track normalizado de Vulpis.
 */
export const mapDriveFileToTrack = (
  file: DriveFile,
  accessToken: string,
  defaultCover: string,
  resolvedUrl?: string
): Track => {
  const streamUrl = resolvedUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

  return {
    mediaId: `drive-${file.id}`,
    url: streamUrl,
    title: file.name.replace(/\.mp3$/i, ''),
    artist: 'Nube Privada (Drive)',
    artworkUrl: defaultCover,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

/**
 * Sube un archivo MP3 a la carpeta dedicada Vulpis en Google Drive.
 */
export const uploadTrackToDrive = async (
  fileUri: string,
  fileName: string,
  accessToken: string
): Promise<UploadTrackResult> => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  // Asegurar que exista la carpeta Vulpis y obtener su ID
  const folderId = await getOrCreateVulpisFolder(accessToken);

  console.log('[DriveApi] Creando metadatos para subir a Vulpis:', fileName);
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
    console.error('[DriveApi] Falló la creación de metadatos de archivo:', err);
    throw new Error(`Error al crear metadatos en Google Drive: ${createResponse.status}`);
  }

  const fileData = await createResponse.json();
  const fileId: string = fileData.id;
  console.log('[DriveApi] Creado marcador de posición con ID:', fileId);

  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  console.log('[DriveApi] Subiendo contenido multimedia a:', uploadUrl);

  const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'audio/mpeg',
    },
    httpMethod: 'PATCH',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  console.log('[DriveApi] Estado del resultado de subida:', uploadResult.status);
  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    console.error('[DriveApi] Detalles del fallo en la subida multimedia:', uploadResult.body);
    // Limpiar el marcador de posición si falló la transferencia
    try {
      await deleteTrackFromDrive(fileId, accessToken);
    } catch (cleanupErr) {
      console.warn('[DriveApi] Falló la limpieza del marcador de posición:', cleanupErr);
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
 * Elimina un archivo de Google Drive usando su identificador `fileId`.
 */
export const deleteTrackFromDrive = async (
  fileId: string,
  accessToken: string
): Promise<boolean> => {
  if (!accessToken) {
    throw new Error('Token de acceso no válido.');
  }

  console.log('[DriveApi] Eliminando archivo de Google Drive:', fileId);
  const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[DriveApi] Falló la eliminación del archivo:', err);
    if (response.status === 404) {
      return true;
    }
    throw new Error(`Error al eliminar archivo de Google Drive: ${response.status}`);
  }

  console.log('[DriveApi] Archivo eliminado exitosamente de Google Drive:', fileId);
  return true;
};
