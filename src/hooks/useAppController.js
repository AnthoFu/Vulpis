import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Image } from 'react-native';
import TrackPlayer, { PlayerCommand, Event, RepeatMode } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTracks } from '../constants/tracks';
import { getStoredToken } from '../utils/drive';
import { isExcludedAudio } from '../utils/audioFilter';

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

import {
  handleAutoCrossfadeProgress,
  smoothTrackTransition,
} from '../utils/crossfade';
import { applyReplayGainToPlayer } from '../utils/replayGain';

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

  // Inicialización de TrackPlayer y restauración de estado
  useEffect(() => {
    let isMounted = true;
    let sub1, sub2, sub3;

    async function init() {
      try {
        console.log('[useAppController] Inicializando TrackPlayer...');
        try {
          await TrackPlayer.setupPlayer({});
        } catch (e) {
          console.log('[useAppController] Player ya estaba configurado, ignorando error:', e.message);
        }

        console.log('[useAppController] Configurando comandos/capacidades del reproductor...');
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
          ],
        });

        console.log('[useAppController] Configurando pistas en la cola del reproductor...');

        // Cargar pistas locales personalizadas del almacenamiento si existen
        const initialTracks = await loadStoredLocalTracks();
        if (isMounted && initialTracks.length > 0) {
          setLocalLibraryTracks(initialTracks);
          setHasCustomLocalTracks(true);
          setTracks(initialTracks);
        }

        // Cargar el estado guardado del reproductor si existe
        const savedState = await loadPlayerState();

        // Verificar si tenemos un token guardado para Drive
        let hasDriveToken = false;
        try {
          const token = await getStoredToken();
          if (token) {
            hasDriveToken = true;
          }
        } catch (tokenErr) {
          console.error('[useAppController] Error al verificar el token de Drive:', tokenErr);
        }

        await TrackPlayer.clear();

        if (savedState && savedState.playQueue && savedState.playQueue.length > 0) {
          console.log('[useAppController] Restaurando el estado guardado del reproductor...');

          let sourceToRestore = savedState.currentSource || 'local';
          if (sourceToRestore === 'private' && !hasDriveToken) {
            console.log(
              '[useAppController] La fuente guardada es privada pero no se encontró ningún token, volviendo a local'
            );
            sourceToRestore = 'local';
          }

          // Filtrar cualquier audio de WhatsApp o no deseado que hubiera quedado en la cola guardada
          const restoredQueue = savedState.playQueue.filter((t) => !isExcludedAudio(t));
          const effectiveQueue = restoredQueue.length > 0 ? restoredQueue : initialTracks;

          if (isMounted) {
            setCurrentSource(sourceToRestore);

            if (sourceToRestore === 'private') {
              setPlayQueue(effectiveQueue);
              setTracks(savedState.tracksList || effectiveQueue);
            } else {
              setPlayQueue(effectiveQueue);
              setTracks(initialTracks);
            }
          }

          if (effectiveQueue.length > 0) {
            await TrackPlayer.setMediaItems(effectiveQueue);

            // Buscar el índice de la pista activa
            let activeIndex = 0;
            if (savedState.activeTrackId) {
              const idx = effectiveQueue.findIndex((t) => t.mediaId === savedState.activeTrackId);
              if (idx !== -1) {
                activeIndex = idx;
              }
            }
            await TrackPlayer.skipToIndex(activeIndex);

            if (savedState.progressPosition && savedState.progressPosition > 0) {
              console.log(`[useAppController] Buscando posición guardada: ${savedState.progressPosition}`);
              await TrackPlayer.seekTo(savedState.progressPosition);
              if (isMounted) {
                const activeTrackItem = effectiveQueue[activeIndex];
                setProgress({
                  position: savedState.progressPosition,
                  duration: activeTrackItem ? activeTrackItem.duration || 0 : 0,
                });
              }
            }
          }
        } else if (initialTracks.length > 0) {
          // Configuración predeterminada con pistas almacenadas
          await TrackPlayer.setMediaItems(initialTracks);
          await TrackPlayer.skipToIndex(0);
          if (isMounted) {
            setPlayQueue(initialTracks);
          }
        }

        // Ejecución de escaneo automático en segundo plano al entrar a la aplicación
        setTimeout(() => {
          console.log('[useAppController] Iniciando escaneo automático de canciones locales...');
          handleScanLocal({ silent: true }).catch((err) => {
            console.log('[useAppController] Error en escaneo automático inicial:', err);
          });
        }, 300);

        console.log('[useAppController] ¡Configuración de TrackPlayer completada exitosamente!');

        sub1 = TrackPlayer.addEventListener(Event.MediaItemTransition, (_event) => {});
        sub2 = TrackPlayer.addEventListener(Event.IsPlayingChanged, (_event) => {});
        sub3 = TrackPlayer.addEventListener(Event.PlaybackStateChanged, (_event) => {});

        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      } catch (err) {
        console.error('[useAppController] Error crítico de configuración del reproductor:', err);
        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (sub1) sub1.remove();
      if (sub2) sub2.remove();
      if (sub3) sub3.remove();
    };
  }, []);

  // Polling JSI Getters para sincronizar el estado en Android
  useEffect(() => {
    if (!isPlayerInitialized) return;

    let tick = 0;
    let lastSavedSec = -1;
    let lastSavedTrackId = null;
    let lastSavedQueueLen = -1;
    let lastAppliedTrackId = null;

    const updatePlayerState = () => {
      try {
        const currentActive = TrackPlayer.getActiveMediaItem();
        const currentPlaying = TrackPlayer.isPlaying();
        const currentProgress = TrackPlayer.getProgress();
        const currentRepeat = TrackPlayer.getRepeatMode();
        const currentShuffle = TrackPlayer.isShuffleEnabled();
        tick++;

        setActiveTrack((prev) => {
          if (!prev && !currentActive) return prev;
          if (
            prev &&
            currentActive &&
            prev.mediaId === currentActive.mediaId &&
            prev.title === currentActive.title &&
            prev.url === currentActive.url
          ) {
            return prev;
          }
          return currentActive;
        });

        setIsPlaying((prev) => (prev === currentPlaying ? prev : currentPlaying));
        setRepeatMode((prev) => (prev === currentRepeat ? prev : currentRepeat));
        setIsShuffleActive((prev) => (prev === currentShuffle ? prev : currentShuffle));

        // Solo sincronizar la cola de TrackPlayer cada 1 segundo (tick % 4 === 0) y NUNCA durante un reordenamiento activo
        if (!isReorderingRef.current && (tick % 4 === 0 || !playQueueRef.current || playQueueRef.current.length === 0)) {
          const currentQueue = TrackPlayer.getQueue();
          if (currentQueue && currentQueue.length > 0) {
            setPlayQueue((prev) => {
              if (isReorderingRef.current) return prev;
              if (!prev || prev.length === 0) return currentQueue;
              if (prev.length === currentQueue.length) {
                let identical = true;
                for (let i = 0; i < prev.length; i++) {
                  if (prev[i]?.mediaId !== currentQueue[i]?.mediaId) {
                    identical = false;
                    break;
                  }
                }
                if (identical) return prev;
              }
              return currentQueue;
            });
          }
        }

        setProgress((prev) => {
          const newPos = currentProgress?.position ?? 0;
          const newDur = currentProgress?.duration ?? 0;
          if (Math.abs(prev.position - newPos) < 0.25 && prev.duration === newDur) {
            return prev;
          }
          return {
            position: newPos,
            duration: newDur,
          };
        });

        // Aplicar normalización de volumen ReplayGain cuando cambia la pista activa
        const activeTrackId = currentActive?.mediaId ?? null;
        if (activeTrackId && activeTrackId !== lastAppliedTrackId) {
          lastAppliedTrackId = activeTrackId;
          applyReplayGainToPlayer(currentActive, replayGainSettingsRef.current);
        }

        // Manejo automático de fundido cruzado cerca del final de la pista
        handleAutoCrossfadeProgress({
          position: currentProgress?.position ?? 0,
          duration: currentProgress?.duration ?? 0,
          isPlaying: currentPlaying,
          crossfadeEnabled: crossfadeSettingsRef.current?.enabled ?? false,
          crossfadeDuration: crossfadeSettingsRef.current?.duration ?? 4,
          activeTrackId: activeTrackId,
        });

        // Verificación de persistencia del estado
        const pos = currentProgress?.position ?? 0;
        const trackId = currentActive?.mediaId ?? null;
        const currentQueueSnapshot = playQueueRef.current || [];
        const queueLen = currentQueueSnapshot.length;

        // Guardar si cambió la pista, o si el progreso avanzó >= 5 segundos, o si la longitud de la cola cambió
        const timeDiff = Math.abs(pos - lastSavedSec);
        if (trackId !== lastSavedTrackId || timeDiff >= 5 || queueLen !== lastSavedQueueLen) {
          lastSavedSec = pos;
          lastSavedTrackId = trackId;
          lastSavedQueueLen = queueLen;

          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: currentQueueSnapshot,
            activeTrackId: trackId,
            progressPosition: pos,
          });
        }
      } catch (e) {
        console.log('[useAppController] Error actualizando estado de TrackPlayer:', e);
      }
    };

    updatePlayerState();
    const interval = setInterval(updatePlayerState, 250);

    return () => clearInterval(interval);
  }, [isPlayerInitialized, savePlayerState]);

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
