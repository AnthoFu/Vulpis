import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import TrackPlayer from '@rntp/player';
import { GOOGLE_OAUTH_CONFIG } from '../constants/config';
import { extractMetadata } from '../utils/metadata';
import {
  getGoogleConfig,
  getStoredToken,
  signInWithGoogle,
  fetchDriveMp3Files,
  mapDriveFileToTrack,
  clearAllCredentials,
  getDriveRedirectUrl,
  uploadTrackToDrive,
  deleteTrackFromDrive,
} from '../utils/drive';

export default function useGoogleDrive({
  currentSource,
  setTracks,
  setIsSourceChanging,
  playQueue,
  setPlayQueue,
  setActiveTrack,
  setIsPlaying,
  showToast,
  defaultCover,
  localLibraryTracks,
  hasCustomLocalTracks,
  saveLocalTracks,
}) {
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(GOOGLE_OAUTH_CONFIG.clientId);
  const [googleRedirectUri, setGoogleRedirectUri] = useState(GOOGLE_OAUTH_CONFIG.redirectUri);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  const currentSourceRef = useRef(currentSource);
  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  useEffect(() => {
    async function loadGoogleConfigData() {
      try {
        const config = await getGoogleConfig();
        if (config) {
          if (config.clientId) setGoogleClientId(config.clientId);
          if (config.redirectUri) setGoogleRedirectUri(config.redirectUri);
        }

        const token = await getStoredToken();
        if (token) {
          setIsDriveConnected(true);
        }
      } catch (err) {
        console.error('[useGoogleDrive] Error al cargar la configuración inicial de Google Drive:', err);
      }
    }
    loadGoogleConfigData();
  }, []);

  const downloadDriveFile = async (fileId, title, accessToken) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const localUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        console.log('[Drive] Archivo ya guardado en caché local:', localUri);
        return localUri;
      }
      
      console.log('[Drive] Descargando archivo a caché:', localUri);
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      console.log('[Drive] Archivo descargado exitosamente:', uri);
      return uri;
    } catch (error) {
      console.error('[Drive] Error al descargar archivo:', error);
      return null;
    }
  };

  const loadDriveFiles = async (token, forceUpdatePlayer = false) => {
    setIsDriveLoading(true);
    const isPrivateActive = currentSourceRef.current === 'private';
    if (isPrivateActive) {
      setIsSourceChanging(true);
    }
    try {
      const files = await fetchDriveMp3Files(token);
      const driveTracks = await Promise.all(
        files.map(async (file) => {
          const resolvedUrl = await getDriveRedirectUrl(file.id, token);
          return mapDriveFileToTrack(file, token, defaultCover, resolvedUrl);
        })
      );
      
      if (isPrivateActive) {
        setTracks(driveTracks);
      }
      
      if (forceUpdatePlayer && isPrivateActive) {
        const active = TrackPlayer.getActiveMediaItem();
        if (!active) {
          await TrackPlayer.clear();
          if (driveTracks.length > 0) {
            await TrackPlayer.setMediaItems(driveTracks);
            await TrackPlayer.skipToIndex(0);
          }
        }
      }
    } catch (err) {
      console.error('[useGoogleDrive] Error al cargar archivos de Drive:', err);
      if (err.message === 'AUTH_EXPIRED') {
        setIsDriveConnected(false);
        if (isPrivateActive) {
          setTracks([]);
        }
        Alert.alert('Sesión Expirada', 'Tu sesión de Google Drive ha expirado. Por favor, conéctate de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudieron obtener las canciones de Google Drive.');
      }
    } finally {
      setIsDriveLoading(false);
      if (isPrivateActive) {
        setIsSourceChanging(false);
      }
    }
  };

  const handleConnectDrive = async (clientId, redirectUri) => {
    setIsDriveLoading(true);
    try {
      const token = await signInWithGoogle(clientId, redirectUri);
      if (token) {
        setIsDriveConnected(true);
        setGoogleClientId(clientId);
        setGoogleRedirectUri(redirectUri);
        showToast('Google Drive conectado exitosamente');
        await loadDriveFiles(token);
      }
    } catch (err) {
      console.error('[useGoogleDrive] Error al conectar Google Drive:', err);
      Alert.alert('Error de Conexión', err.message || 'No se pudo conectar a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDisconnectDrive = async () => {
    Alert.alert(
      'Desconectar Nube Privada',
      '¿Estás seguro de que quieres desconectar tu cuenta de Google Drive?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            setIsDriveLoading(true);
            try {
              await clearAllCredentials();
              setIsDriveConnected(false);
              setTracks([]);
              await TrackPlayer.clear();
              showToast('Google Drive desconectado');
            } catch (err) {
              console.error('[useGoogleDrive] Error al desconectar:', err);
            } finally {
              setIsDriveLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUploadTrackToDrive = async () => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;

      const asset = res.assets[0];
      setIsDriveLoading(true);
      showToast(`Subiendo: ${asset.name}...`);

      await uploadTrackToDrive(asset.uri, asset.name, token);
      
      showToast('¡Subida completada!');
      await loadDriveFiles(token);
    } catch (e) {
      console.error('[useGoogleDrive] Error al subir a Drive:', e);
      Alert.alert('Error', 'No se pudo subir la canción a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleUploadLocalTrackToDrive = async (track) => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert(
        'Google Drive no conectado',
        'Por favor, conéctate a Google Drive en la pestaña de Nube Privada primero.'
      );
      return;
    }

    setIsDriveLoading(true);
    showToast(`Subiendo a Drive: ${track.title}...`);

    try {
      let filename = track.title;
      if (!filename.toLowerCase().endsWith('.mp3')) {
        filename += '.mp3';
      }

      await uploadTrackToDrive(track.url, filename, token);
      showToast('¡Subido a Drive exitosamente!');
      await loadDriveFiles(token);
    } catch (e) {
      console.error('[useGoogleDrive] Error al subir pista local a Drive:', e);
      Alert.alert('Error', 'No se pudo subir la canción seleccionada a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDeleteDriveTrack = async (track) => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
      return;
    }

    const fileId = track.mediaId.replace(/^drive-/, '');
    setIsDriveLoading(true);
    showToast(`Eliminando: ${track.title}...`);

    try {
      await deleteTrackFromDrive(fileId, token);

      const cacheUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
      try {
        const cacheInfo = await FileSystem.getInfoAsync(cacheUri);
        if (cacheInfo.exists) {
          await FileSystem.deleteAsync(cacheUri);
        }
      } catch (cacheErr) {
        console.warn('[useGoogleDrive] Error al eliminar archivo en caché:', cacheErr);
      }

      const active = TrackPlayer.getActiveMediaItem();
      if (active && active.mediaId === track.mediaId) {
        await TrackPlayer.stop();
        await TrackPlayer.clear();
        setActiveTrack(null);
        setIsPlaying(false);
      }

      const updatedQueue = playQueue.filter(t => t.mediaId !== track.mediaId);
      setPlayQueue(updatedQueue);

      await loadDriveFiles(token);
      showToast('Canción eliminada de Drive');
    } catch (e) {
      console.error('[useGoogleDrive] Error al eliminar de Drive:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción de Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDownloadDriveTrack = async (track) => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
      return;
    }

    const startDownload = async (savedDirectoryUri = null) => {
      setIsDriveLoading(true);
      showToast(`Preparando descarga: ${track.title}...`);

      try {
        let persistentLocalUri = null;
        const sanitizedTitle = track.title.replace(/[/\\?%*:|"<>]/g, '_');
        const tempFilename = `${sanitizedTitle}.mp3`;

        const fileId = track.mediaId.replace(/^drive-/, '');
        const cachedUri = await downloadDriveFile(fileId, track.title, token);
        if (!cachedUri) {
          throw new Error('No se pudo descargar el archivo de Google Drive.');
        }

        persistentLocalUri = FileSystem.documentDirectory + tempFilename;
        await FileSystem.copyAsync({
          from: cachedUri,
          to: persistentLocalUri,
        });

        if (Platform.OS === 'android') {
          let directoryUri = savedDirectoryUri;

          if (!directoryUri) {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
              Alert.alert('Permiso cancelado', 'No se pudo guardar la canción en el almacenamiento público.');
              setIsDriveLoading(false);
              return;
            }
            directoryUri = permissions.directoryUri;
            await AsyncStorage.setItem('vulpis_download_directory_uri', directoryUri);
          }

          showToast('Exportando al dispositivo...');
          
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
        const newLocalTrack = {
          mediaId: `local-drive-${Date.now()}`,
          url: persistentLocalUri,
          title: meta.title || track.title || tempFilename.replace(/\.mp3$/i, ''),
          artist: meta.artist || track.artist || 'Descargado de Drive',
          artworkUrl: meta.artworkUrl || track.artworkUrl || defaultCover,
        };

        const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
        const updatedTracks = [...existingCustom, newLocalTrack];
        
        await saveLocalTracks(updatedTracks);
        showToast('¡Guardado exitosamente!');
        
        Alert.alert(
          'Descarga Completada',
          Platform.OS === 'android' 
            ? `La canción "${track.title}" se guardó en tu dispositivo y se agregó a tu biblioteca local de Vulpis.`
            : `La canción "${track.title}" se ha descargado y guardado en tu biblioteca local.`
        );

      } catch (error) {
        console.error('[useGoogleDrive] Error en handleDownloadDriveTrack:', error);
        if (savedDirectoryUri) {
          try {
            await AsyncStorage.removeItem('vulpis_download_directory_uri');
          } catch (e) {
            console.warn('[useGoogleDrive] Error al limpiar directorio URI:', e);
          }
        }
        Alert.alert(
          'Error de Descarga',
          'Ocurrió un problema al descargar o guardar la canción. Si cambiaste los permisos de tu carpeta, inténtalo de nuevo para volver a seleccionarla.'
        );
      } finally {
        setIsDriveLoading(false);
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
              { text: 'Elegir Carpeta', onPress: () => startDownload(null) }
            ]
          );
        }
      } catch (err) {
        console.error('[useGoogleDrive] Error al leer directorio guardado:', err);
        await startDownload(null);
      }
    } else {
      await startDownload();
    }
  };

  const handleRefreshDrive = async () => {
    const token = await getStoredToken();
    if (token) {
      await loadDriveFiles(token);
      showToast('Biblioteca de Drive actualizada');
    } else {
      setIsDriveConnected(false);
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
    }
  };

  return {
    isDriveConnected,
    setIsDriveConnected,
    googleClientId,
    googleRedirectUri,
    isDriveLoading,
    setIsDriveLoading,
    downloadDriveFile,
    loadDriveFiles,
    handleConnectDrive,
    handleDisconnectDrive,
    handleUploadTrackToDrive,
    handleUploadLocalTrackToDrive,
    handleDeleteDriveTrack,
    handleDownloadDriveTrack,
    handleRefreshDrive,
  };
}
