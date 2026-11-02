import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractMetadata } from '../../utils/metadata';
import { Track, createTrack } from '../../models/Track';

/**
 * Parámetros para la exportación y guardado permanente de una pista de Drive en el dispositivo.
 */
export interface SaveDriveTrackParams {
  track: Track;
  token: string;
  defaultCover: string;
  hasCustomLocalTracks: boolean;
  localLibraryTracks: Track[];
  saveLocalTracks: (tracks: Track[]) => Promise<void> | void;
  showToast?: (message: string) => void;
  setIsLoading?: (loading: boolean) => void;
}

/**
 * Descarga un archivo de Google Drive a la carpeta temporal de caché para reproducción local.
 * Implementa control de existencia previa para evitar descargas redundantes.
 */
export const downloadDriveFile = async (
  fileId: string,
  title: string,
  accessToken: string
): Promise<string | null> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const localUri = `${FileSystem.cacheDirectory}${fileId}.mp3`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log('[DriveDownload] Archivo ya guardado en caché local:', localUri);
      return localUri;
    }

    console.log('[DriveDownload] Descargando archivo a caché:', localUri);
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localUri,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const result = await downloadResumable.downloadAsync();
    const uri = result?.uri || localUri;
    console.log('[DriveDownload] Archivo descargado exitosamente:', uri);
    return uri;
  } catch (error) {
    console.error('[DriveDownload] Error al descargar archivo:', error);
    return null;
  }
};

/**
 * Descarga y exporta una pista de Google Drive al almacenamiento local permanente del dispositivo (SAF en Android).
 */
export const saveDriveTrackToDevice = async ({
  track,
  token,
  defaultCover,
  hasCustomLocalTracks,
  localLibraryTracks,
  saveLocalTracks,
  showToast,
  setIsLoading,
}: SaveDriveTrackParams): Promise<void> => {
  const startDownload = async (savedDirectoryUri: string | null = null): Promise<void> => {
    if (setIsLoading) setIsLoading(true);
    if (showToast) showToast(`Preparando descarga: ${track.title}...`);

    try {
      let persistentLocalUri: string | null = null;
      const sanitizedTitle = track.title.replace(/[/\\?%*:|"<>]/g, '_');
      const tempFilename = `${sanitizedTitle}.mp3`;

      const fileId = track.mediaId.replace(/^drive-/, '');
      const cachedUri = await downloadDriveFile(fileId, track.title, token);
      if (!cachedUri) {
        throw new Error('No se pudo descargar el archivo de Google Drive.');
      }

      persistentLocalUri = `${FileSystem.documentDirectory}${tempFilename}`;
      await FileSystem.copyAsync({
        from: cachedUri,
        to: persistentLocalUri,
      });

      if (Platform.OS === 'android') {
        let directoryUri = savedDirectoryUri;

        if (!directoryUri) {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            Alert.alert(
              'Permiso cancelado',
              'No se pudo guardar la canción en el almacenamiento público.'
            );
            if (setIsLoading) setIsLoading(false);
            return;
          }
          directoryUri = permissions.directoryUri;
          await AsyncStorage.setItem('vulpis_download_directory_uri', directoryUri);
        }

        if (showToast) showToast('Exportando al dispositivo...');

        const base64Data = await FileSystem.readAsStringAsync(cachedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const publicFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          sanitizedTitle,
          'audio/mpeg'
        );

        await FileSystem.writeAsStringAsync(publicFileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const meta = await extractMetadata(persistentLocalUri);
      const newLocalTrack = createTrack({
        mediaId: `local-drive-${Date.now()}`,
        url: persistentLocalUri,
        title: meta.title || track.title || tempFilename.replace(/\.mp3$/i, ''),
        artist: meta.artist || track.artist || 'Descargado de Drive',
        album: meta.album || track.album || 'Google Drive',
        genre: meta.genre || track.genre || null,
        artworkUrl: meta.artworkUrl || track.artworkUrl || defaultCover,
        lyrics: meta.lyrics || null,
        replayGain: meta.replayGain || null,
      });

      const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
      const updatedTracks = [...existingCustom, newLocalTrack];

      await saveLocalTracks(updatedTracks);
      if (showToast) showToast('¡Guardado exitosamente!');

      Alert.alert(
        'Descarga Completada',
        Platform.OS === 'android'
          ? `La canción "${track.title}" se guardó en tu dispositivo y se agregó a tu biblioteca local de Vulpis.`
          : `La canción "${track.title}" se ha descargado y guardado en tu biblioteca local.`
      );
    } catch (error) {
      console.error('[DriveDownload] Error en saveDriveTrackToDevice:', error);
      if (savedDirectoryUri) {
        try {
          await AsyncStorage.removeItem('vulpis_download_directory_uri');
        } catch (e) {
          console.warn('[DriveDownload] Error al limpiar directorio URI:', e);
        }
      }
      Alert.alert(
        'Error de Descarga',
        'Ocurrió un problema al descargar o guardar la canción. Si cambiaste los permisos de tu carpeta, inténtalo de nuevo para volver a seleccionarla.'
      );
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  if (Platform.OS === 'android') {
    try {
      const savedUri = await AsyncStorage.getItem('vulpis_download_directory_uri');
      if (savedUri) {
        await startDownload(savedUri);
      } else {
        Alert.alert(
          'Activar Descargas Públicas',
          'Para que otras aplicaciones de tu teléfono puedan acceder a tu música descargada, necesitamos que elijas una carpeta una sola vez.\n\n' +
            '1. En la siguiente pantalla, selecciona o crea una carpeta en tu teléfono (te sugerimos "Música" o "Descargas").\n' +
            '2. Presiona el botón grande azul abajo que dice "Usar esta carpeta" (o "Permitir acceso").\n\n' +
            '¡Y listo! Las próximas descargas se realizarán automáticamente sin preguntarte nada.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Elegir Carpeta', onPress: () => startDownload(null) },
          ]
        );
      }
    } catch (err) {
      console.error('[DriveDownload] Error al leer directorio guardado:', err);
      await startDownload(null);
    }
  } else {
    await startDownload();
  }
};
