import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Image } from 'react-native';
import TrackPlayer, { RepeatMode } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTracks } from '../constants/tracks';
import { getStoredToken } from '../utils/drive';

// Hooks personalizados para lógica modular
import useToast from './useToast';
import usePlaylists from './usePlaylists';
import useLocalLibrary from './useLocalLibrary';
import useGoogleDrive from './useGoogleDrive';
import useSleepTimer from './useSleepTimer';
import useAudioSettings from './useAudioSettings';
import usePlayerPersistence from './usePlayerPersistence';
import useQueueController from './useQueueController';
import useDrivePrefetch from './useDrivePrefetch';
import usePlayerInitializer from './usePlayerInitializer';
import usePlayerStateSync from './usePlayerStateSync';

import { smoothTrackTransition } from '../utils/crossfade';

export default function useAppController() {
  const insets = useSafeAreaInsets();
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [startWithQueueVisible, setStartWithQueueVisible] = useState(false);
  const [playQueue, setPlayQueue] = useState([]);
  const playQueueRef = useRef(playQueue);
  playQueueRef.current = playQueue;

  // Estados del menú lateral de navegación y de la fuente
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState('local'); // 'local' | 'private'
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);

  // Flag para evitar que el polling sobreescriba la cola durante un reordenamiento nativo
  const isReorderingRef = useRef(false);
  const currentSourceRef = useRef(currentSource);
  const tracksRef = useRef(tracks);

  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Hook de notificaciones flotantes (Toast)
  const { toast, showToast } = useToast();

  // Hook de persistencia de datos (AsyncStorage / CursorWindow safe)
  const { savePlayerState, loadPlayerState, loadStoredLocalTracks } = usePlayerPersistence();

  // Hook de ajustes acústicos (Fundido cruzado y ReplayGain)
  const {
    crossfadeSettings,
    crossfadeSettingsRef,
    handleUpdateCrossfade,
    replayGainSettings,
    replayGainSettingsRef,
    handleUpdateReplayGain,
  } = useAudioSettings({ activeTrack, showToast });

  // Hook de temporizador de apagado
  const {
    isTimerActive,
    timerMode,
    secondsRemaining,
    timeRemainingFormatted,
    startSleepTimer,
    cancelSleepTimer,
  } = useSleepTimer({
    isPlaying,
    activeTrack,
    showToast,
  });

  // Hook de listas de reproducción
  const {
    playlists,
    setPlaylists,
    favoritesPlaylist,
    isFavoriteTrack,
    handleToggleFavorite,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
  } = usePlaylists(showToast);

  // Hook de biblioteca local
  const {
    localLibraryTracks,
    setLocalLibraryTracks,
    hasCustomLocalTracks,
    setHasCustomLocalTracks,
    saveLocalTracks,
    handleScanLocal,
    handleImportMp3,
    handleResetLocal,
    handleDeleteLocalTrack,
  } = useLocalLibrary({
    currentSource,
    setTracks,
    defaultCover,
    setIsSourceChanging,
    playQueue,
    setPlayQueue,
    setActiveTrack,
    setIsPlaying,
    showToast,
  });

  // Hook de integración con Google Drive
  const {
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
  } = useGoogleDrive({
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
  });

  // Hook para manipular la cola de reproducción
  const {
    handleAddToQueue,
    handleRemoveFromQueue,
    handleMoveQueueItem,
    handleClearUpcomingQueue,
    handleSetDragActive,
    handleReorderQueueState,
    handleSyncReorderNative,
  } = useQueueController({
    playQueue,
    setPlayQueue,
    playQueueRef,
    activeTrack,
    progress,
    showToast,
    currentSourceRef,
    savePlayerState,
    isReorderingRef,
  });

  // Hook para precargar la siguiente pista de Drive en segundo plano
  useDrivePrefetch({
    activeTrack,
    isPlayerInitialized,
    setPlayQueue,
    setTracks,
    downloadDriveFile,
  });

  // Hook de inicialización y restauración del estado de TrackPlayer
  usePlayerInitializer({
    setLocalLibraryTracks,
    setHasCustomLocalTracks,
    setTracks,
    setCurrentSource,
    setPlayQueue,
    setProgress,
    setIsPlayerInitialized,
    loadStoredLocalTracks,
    loadPlayerState,
    handleScanLocal,
  });

  // Hook de sincronización en tiempo real (polling JSI) del estado del reproductor
  usePlayerStateSync({
    isPlayerInitialized,
    setActiveTrack,
    setIsPlaying,
    setRepeatMode,
    setIsShuffleActive,
    setPlayQueue,
    setProgress,
    playQueueRef,
    isReorderingRef,
    currentSourceRef,
    crossfadeSettingsRef,
    replayGainSettingsRef,
    savePlayerState,
  });

  // Restaurar automáticamente las pistas de la biblioteca si la cola de reproducción queda completamente vacía
  useEffect(() => {
    if (!isPlayerInitialized || isSourceChanging) return;

    if (playQueue.length === 0 && tracks && tracks.length > 0) {
      console.log('[useAppController] La cola está vacía. Restaurando automáticamente las pistas de la biblioteca...');
      const restoreLibrary = async () => {
        try {
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(tracks);
          await TrackPlayer.skipToIndex(0);
        } catch (err) {
          console.error('[useAppController] Error al restaurar las pistas de la biblioteca:', err);
        }
      };
      restoreLibrary();
    }
  }, [playQueue.length, tracks, isPlayerInitialized, isSourceChanging]);

  const handleSourceChange = async (source) => {
    if (source === currentSource || isSourceChanging) return;
    setIsSourceChanging(true);
    setCurrentSource(source);

    if (source === 'local') {
      setTracks(localLibraryTracks);
      setIsSourceChanging(false);
    } else if (source === 'private') {
      const token = await getStoredToken();
      if (token) {
        setIsDriveConnected(true);
        await loadDriveFiles(token, false);
      } else {
        setIsDriveConnected(false);
        setTracks([]);
        setIsSourceChanging(false);
      }
    } else if (source === 'playlists') {
      setIsSourceChanging(false);
    }
  };

  const handleSelectTrack = async (item, index, playlistTracks) => {
    const trackListToLoad = playlistTracks || tracks;

    if (item.mediaId.startsWith('drive-') && !item.url.startsWith('file://')) {
      try {
        showToast(`Descargando canción: ${item.title}...`);
        setIsSourceChanging(true);

        const token = await getStoredToken();
        const fileId = item.mediaId.replace('drive-', '');
        const localUri = await downloadDriveFile(fileId, item.title, token);

        if (localUri) {
          const updatedTracks = trackListToLoad.map((t) => {
            if (t.mediaId === item.mediaId) {
              return { ...t, url: localUri };
            }
            return t;
          });

          if (!playlistTracks) {
            setTracks(updatedTracks);
          }

          // Actualizar las URLs de las pistas de las listas de reproducción
          const updatedPlaylists = playlists.map((p) => {
            const hasTrack = p.tracks.some((t) => t.mediaId === item.mediaId);
            if (hasTrack) {
              return {
                ...p,
                tracks: p.tracks.map((t) => (t.mediaId === item.mediaId ? { ...t, url: localUri } : t)),
              };
            }
            return p;
          });
          setPlaylists(updatedPlaylists);
          await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updatedPlaylists));

          console.log('[useAppController] Cargando pista con archivo local guardado en caché:', localUri);
          await smoothTrackTransition(async () => {
            await TrackPlayer.clear();
            await TrackPlayer.setMediaItems(updatedTracks);
            const newIdx = updatedTracks.findIndex((t) => t.mediaId === item.mediaId);
            await TrackPlayer.skipToIndex(newIdx !== -1 ? newIdx : index);
            await TrackPlayer.play();
          }, crossfadeSettingsRef.current?.enabled);
        } else {
          Alert.alert('Error', 'No se pudo descargar el archivo de Google Drive.');
        }
      } catch (err) {
        console.error('[useAppController] Error en la descarga de handleSelectTrack:', err);
        Alert.alert('Error', 'No se pudo reproducir la canción.');
      } finally {
        setIsSourceChanging(false);
      }
    } else {
      try {
        await smoothTrackTransition(async () => {
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(trackListToLoad);
          await TrackPlayer.skipToIndex(index);
          await TrackPlayer.play();
        }, crossfadeSettingsRef.current?.enabled);
      } catch (e) {
        console.error('[useAppController] Error al seleccionar pista:', e);
      }
    }
  };

  return {
    insets,
    defaultCover,
    isPlayerInitialized,
    activeTrack,
    isPlaying,
    progress,
    repeatMode,
    isShuffleActive,
    isFullPlayerVisible,
    setIsFullPlayerVisible,
    startWithQueueVisible,
    setStartWithQueueVisible,
    playQueue,
    isDrawerOpen,
    setIsDrawerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    currentSource,
    tracks,
    isSourceChanging,
    toast,
    showToast,
    playlists,
    favoritesPlaylist,
    isFavoriteTrack,
    handleToggleFavorite,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
    hasCustomLocalTracks,
    handleScanLocal,
    handleImportMp3,
    handleResetLocal,
    handleDeleteLocalTrack,
    isDriveConnected,
    googleClientId,
    googleRedirectUri,
    isDriveLoading,
    handleConnectDrive,
    handleDisconnectDrive,
    handleRefreshDrive,
    handleUploadTrackToDrive,
    handleUploadLocalTrackToDrive,
    handleDeleteDriveTrack,
    handleDownloadDriveTrack,
    handleAddToQueue,
    handleRemoveFromQueue,
    handleMoveQueueItem,
    handleClearUpcomingQueue,
    handleReorderQueueState,
    handleSyncReorderNative,
    handleSetDragActive,
    handleSourceChange,
    handleSelectTrack,
    isTimerActive,
    timerMode,
    secondsRemaining,
    timeRemainingFormatted,
    startSleepTimer,
    cancelSleepTimer,
    isSleepTimerModalOpen,
    setIsSleepTimerModalOpen,
    crossfadeSettings,
    handleUpdateCrossfade,
    replayGainSettings,
    handleUpdateReplayGain,
  };
}
