import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import TrackPlayer from '@rntp/player';
import { GOOGLE_OAUTH_CONFIG } from '../constants/config';
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
  downloadDriveFile,
  saveDriveTrackToDevice,
} from '../services/drive';
import { Track } from '../models/Track';

export interface UseGoogleDriveParams {
  currentSource: string;
  setTracks: Dispatch<SetStateAction<Track[]>>;
  setIsSourceChanging: Dispatch<SetStateAction<boolean>>;
  playQueue: Track[];
  setPlayQueue: Dispatch<SetStateAction<Track[]>>;
  setActiveTrack: Dispatch<SetStateAction<Track | null>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  showToast?: (message: string) => void;
  defaultCover: any;
  localLibraryTracks: Track[];
  hasCustomLocalTracks: boolean;
  saveLocalTracks: (tracks: Track[]) => Promise<void>;
}

export interface UseGoogleDriveReturn {
  isDriveConnected: boolean;
  setIsDriveConnected: Dispatch<SetStateAction<boolean>>;
  googleClientId: string;
  googleRedirectUri: string;
  isDriveLoading: boolean;
  setIsDriveLoading: Dispatch<SetStateAction<boolean>>;
  downloadDriveFile: typeof downloadDriveFile;
  loadDriveFiles: (token: string, forceUpdatePlayer?: boolean) => Promise<void>;
  handleConnectDrive: (clientId: string, redirectUri: string) => Promise<void>;
  handleDisconnectDrive: () => Promise<void>;
  handleUploadTrackToDrive: () => Promise<void>;
  handleUploadLocalTrackToDrive: (track: Track) => Promise<void>;
  handleDeleteDriveTrack: (track: Track) => Promise<void>;
  handleDownloadDriveTrack: (track: Track) => Promise<void>;
  handleRefreshDrive: () => Promise<void>;
}

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
}: UseGoogleDriveParams): UseGoogleDriveReturn {
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

  const loadDriveFiles = async (token: string, forceUpdatePlayer = false): Promise<void> => {
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
            await TrackPlayer.setMediaItems(driveTracks as any);
            await TrackPlayer.skipToIndex(0);
          }
        }
      }
    } catch (err: any) {
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

  const handleConnectDrive = async (clientId: string, redirectUri: string): Promise<void> => {
    setIsDriveLoading(true);
    try {
      const token = await signInWithGoogle(clientId, redirectUri);
      if (token) {
        setIsDriveConnected(true);
        setGoogleClientId(clientId);
        setGoogleRedirectUri(redirectUri);
        if (showToast) showToast('Google Drive conectado exitosamente');
        await loadDriveFiles(token);
      }
    } catch (err: any) {
      console.error('[useGoogleDrive] Error al conectar Google Drive:', err);
      Alert.alert('Error de Conexión', err.message || 'No se pudo conectar a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDisconnectDrive = async (): Promise<void> => {
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
              if (showToast) showToast('Google Drive desconectado');
            } catch (err) {
              console.error('[useGoogleDrive] Error al desconectar:', err);
            } finally {
              setIsDriveLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUploadTrackToDrive = async (): Promise<void> => {
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
      if (showToast) showToast(`Subiendo: ${asset.name}...`);

      await uploadTrackToDrive(asset.uri, asset.name, token);

      if (showToast) showToast('¡Subida completada!');
      await loadDriveFiles(token);
    } catch (e) {
      console.error('[useGoogleDrive] Error al subir a Drive:', e);
      Alert.alert('Error', 'No se pudo subir la canción a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleUploadLocalTrackToDrive = async (track: Track): Promise<void> => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert(
        'Google Drive no conectado',
        'Por favor, conéctate a Google Drive en la pestaña de Nube Privada primero.'
      );
      return;
    }

    setIsDriveLoading(true);
    if (showToast) showToast(`Subiendo a Drive: ${track.title}...`);

    try {
      let filename = track.title;
      if (!filename.toLowerCase().endsWith('.mp3')) {
        filename += '.mp3';
      }

      await uploadTrackToDrive(track.url, filename, token);
      if (showToast) showToast('¡Subido a Drive exitosamente!');
      await loadDriveFiles(token);
    } catch (e) {
      console.error('[useGoogleDrive] Error al subir pista local a Drive:', e);
      Alert.alert('Error', 'No se pudo subir la canción seleccionada a Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDeleteDriveTrack = async (track: Track): Promise<void> => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
      return;
    }

    const fileId = track.mediaId.replace(/^drive-/, '');
    setIsDriveLoading(true);
    if (showToast) showToast(`Eliminando: ${track.title}...`);

    try {
      await deleteTrackFromDrive(fileId, token);

      const cacheUri = `${FileSystem.cacheDirectory}${fileId}.mp3`;
      try {
        const cacheInfo = await FileSystem.getInfoAsync(cacheUri);
        if (cacheInfo.exists) {
          await FileSystem.deleteAsync(cacheUri);
        }
      } catch (cacheErr) {
        console.warn('[useGoogleDrive] Error al eliminar archivo en caché:', cacheErr);
      }

      const active = TrackPlayer.getActiveMediaItem() as Track | null;
      if (active && active.mediaId === track.mediaId) {
        await TrackPlayer.stop();
        await TrackPlayer.clear();
        setActiveTrack(null);
        setIsPlaying(false);
      }

      const updatedQueue = playQueue.filter((t) => t.mediaId !== track.mediaId);
      setPlayQueue(updatedQueue);

      await loadDriveFiles(token);
      if (showToast) showToast('Canción eliminada de Drive');
    } catch (e) {
      console.error('[useGoogleDrive] Error al eliminar de Drive:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción de Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDownloadDriveTrack = async (track: Track): Promise<void> => {
    const token = await getStoredToken();
    if (!token) {
      Alert.alert('No Conectado', 'Por favor, conéctate a Google Drive primero.');
      return;
    }

    await saveDriveTrackToDevice({
      track,
      token,
      defaultCover,
      hasCustomLocalTracks,
      localLibraryTracks,
      saveLocalTracks,
      showToast,
      setIsLoading: setIsDriveLoading,
    });
  };

  const handleRefreshDrive = async (): Promise<void> => {
    const token = await getStoredToken();
    if (token) {
      await loadDriveFiles(token);
      if (showToast) showToast('Biblioteca de Drive actualizada');
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
