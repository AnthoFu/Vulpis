import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Image } from 'react-native';
import TrackPlayer, { PlayerCommand, Event, RepeatMode } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTracks } from '../constants/tracks';
import { getStoredToken } from '../utils/drive';

// Custom Hooks for modular logic
import useToast from './useToast';
import usePlaylists from './usePlaylists';
import useLocalLibrary from './useLocalLibrary';
import useGoogleDrive from './useGoogleDrive';
import useSleepTimer from './useSleepTimer';
import {
  getCrossfadeSettings,
  saveCrossfadeSettings,
  handleAutoCrossfadeProgress,
  smoothTrackTransition,
  DEFAULT_CROSSFADE_SETTINGS,
} from '../utils/crossfade';
import {
  getReplayGainSettings,
  saveReplayGainSettings,
  DEFAULT_REPLAYGAIN_SETTINGS,
  applyReplayGainToPlayer,
  calculateTrackVolumeMultiplier,
} from '../utils/replayGain';

// Sanitiza la cola para evitar que cadenas base64 gigantes excedan el límite de SQLite CursorWindow (2MB) en Android
const sanitizeQueueForStorage = (queue) => {
  if (!queue || !Array.isArray(queue)) return [];
  return queue.map(t => ({
    mediaId: t.mediaId,
    url: t.url,
    title: t.title,
    artist: t.artist,
    album: t.album || '',
    genre: t.genre || '',
    duration: t.duration || 0,
    artworkUrl: (t.artworkUrl && t.artworkUrl.startsWith('data:')) ? null : t.artworkUrl,
    gain: t.gain,
    peak: t.peak,
  }));
};

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

  // Flag para evitar que el polling sobreescriba la cola durante un reordenamiento nativo
  const isReorderingRef = useRef(false);

  // Hooks personalizados para logica estandarizada y modular
  const { toast, showToast } = useToast();

  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);

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

  const [crossfadeSettings, setCrossfadeSettings] = useState(DEFAULT_CROSSFADE_SETTINGS);
  const crossfadeSettingsRef = useRef(crossfadeSettings);

  useEffect(() => {
    crossfadeSettingsRef.current = crossfadeSettings;
  }, [crossfadeSettings]);

  useEffect(() => {
    getCrossfadeSettings().then(setCrossfadeSettings);
  }, []);

  const handleUpdateCrossfade = async (newSettings) => {
    setCrossfadeSettings(newSettings);
    await saveCrossfadeSettings(newSettings);
    showToast(newSettings.enabled ? `Fundido cruzado activado (${newSettings.duration}s)` : 'Fundido cruzado desactivado');
  };

  const [replayGainSettings, setReplayGainSettings] = useState(DEFAULT_REPLAYGAIN_SETTINGS);
  const replayGainSettingsRef = useRef(replayGainSettings);

  useEffect(() => {
    replayGainSettingsRef.current = replayGainSettings;
  }, [replayGainSettings]);

  useEffect(() => {
    getReplayGainSettings().then((loaded) => {
      setReplayGainSettings(loaded);
      if (activeTrack) {
        applyReplayGainToPlayer(activeTrack, loaded);
      }
    });
  }, []);

  const handleUpdateReplayGain = async (newSettings) => {
    setReplayGainSettings(newSettings);
    await saveReplayGainSettings(newSettings);
    if (activeTrack) {
      applyReplayGainToPlayer(activeTrack, newSettings);
    }
    showToast(
      newSettings.enabled
        ? `ReplayGain activado (Modo: ${newSettings.mode === 'album' ? 'Álbum' : 'Pista'})`
        : 'ReplayGain desactivado'
    );
  };

  const {
    playlists,
    setPlaylists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
  } = usePlaylists(showToast);

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

  const handleAddToQueue = async (item) => {
    try {
      let activeIndex = TrackPlayer.getActiveMediaItemIndex();
      if (activeIndex === null || activeIndex === -1) {
        activeIndex = activeTrack ? playQueue.findIndex(t => t.mediaId === activeTrack.mediaId) : 0;
        if (activeIndex === -1) activeIndex = 0;
      }
      
      const uniqueQueueId = `${item.mediaId}-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const queuedItem = {
        ...item,
        mediaId: uniqueQueueId,
        queueId: uniqueQueueId,
      };

      console.log(`[useAppController] Agregando pista ${item.title} a la cola después del índice ${activeIndex}`);
      isReorderingRef.current = true;
      await TrackPlayer.insertMediaItem(activeIndex + 1, queuedItem);

      // Actualizar el estado de la cola de reproducción (playQueue)
      let updatedQueue = [];
      setPlayQueue(prev => {
        const copy = [...prev];
        copy.splice(activeIndex + 1, 0, queuedItem);
        updatedQueue = copy;
        return copy;
      });

      AsyncStorage.setItem('vulpis_player_state', JSON.stringify({
        currentSource: currentSourceRef.current,
        playQueue: sanitizeQueueForStorage(updatedQueue),
        activeTrackId: activeTrack?.mediaId ?? null,
        progressPosition: progress.position,
      })).catch(err => console.error('[useAppController] Error guardando estado tras añadir a cola:', err));

      setTimeout(() => {
        isReorderingRef.current = false;
      }, 500);

      showToast(`Añadido a la cola: ${item.title}`);
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useAppController] Error al agregar pista a la cola:', e);
      Alert.alert('Error', 'No se pudo agregar la canción a la cola.');
    }
  };

  const handleRemoveFromQueue = useCallback(async (item, index) => {
    try {
      console.log(`[useAppController] 🗑️ Eliminando pista de la cola en índice ${index}: "${item.title}"`);
      isReorderingRef.current = true;
      await TrackPlayer.removeMediaItem(index);
      
      let updatedQueue = [];
      setPlayQueue(prev => {
        const copy = [...prev];
        copy.splice(index, 1);
        updatedQueue = copy;
        return copy;
      });

      AsyncStorage.setItem('vulpis_player_state', JSON.stringify({
        currentSource: currentSourceRef.current,
        playQueue: sanitizeQueueForStorage(updatedQueue),
        activeTrackId: activeTrack?.mediaId ?? null,
        progressPosition: progress.position,
      })).catch(err => console.error('[useAppController] Error guardando estado tras eliminar de cola:', err));

      setTimeout(() => {
        isReorderingRef.current = false;
      }, 500);

      showToast(`Eliminado de la cola: ${item.title}`);
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useAppController] ❌ Error al eliminar pista de la cola:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción de la cola.');
    }
  }, [activeTrack?.mediaId, progress.position, showToast]);

  // Mueve una pista de un índice a otro en la cola usando TrackPlayer.moveMediaItem nativo sin cortar la música
  const handleMoveQueueItem = useCallback(async (fromIndex, toIndex) => {
    try {
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || toIndex < 0) return;
      const currentQ = playQueueRef.current || [];
      if (fromIndex >= currentQ.length || toIndex >= currentQ.length) {
        console.warn(`[useAppController] ⚠️ Índices de movimiento fuera de rango: from=${fromIndex}, to=${toIndex}, total=${currentQ.length}`);
        return;
      }

      console.log(`[useAppController] 🚀 [handleMoveQueueItem] Moviendo pista de índice ${fromIndex} a ${toIndex}: "${currentQ[fromIndex]?.title}"`);
      isReorderingRef.current = true;

      let updatedQueue = [];
      setPlayQueue(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        updatedQueue = copy;
        return copy;
      });

      // Mover nativamente en TrackPlayer sin reiniciar la canción actual
      console.log(`[useAppController] 🎵 Ejecutando TrackPlayer.moveMediaItem(${fromIndex}, ${toIndex})`);
      await TrackPlayer.moveMediaItem(fromIndex, toIndex);
      console.log(`[useAppController] ✅ TrackPlayer.moveMediaItem finalizado correctamente`);

      AsyncStorage.setItem('vulpis_player_state', JSON.stringify({
        currentSource: currentSourceRef.current,
        playQueue: sanitizeQueueForStorage(updatedQueue),
        activeTrackId: activeTrack?.mediaId ?? null,
        progressPosition: progress.position,
      })).catch(err => console.error('[useAppController] Error guardando estado tras mover pista:', err));

      setTimeout(() => {
        isReorderingRef.current = false;
        console.log(`[useAppController] 🔓 Polling desbloqueado tras reordenar`);
      }, 800);
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useAppController] ❌ Error al mover pista en la cola:', e);
    }
  }, [activeTrack?.mediaId, progress.position]);

  // Vacía todas las pistas siguientes de la cola manteniendo la canción que está sonando
  const handleClearUpcomingQueue = useCallback(async () => {
    try {
      let activeIndex = TrackPlayer.getActiveMediaItemIndex();
      const currentQ = playQueueRef.current || [];
      if (activeIndex === null || activeIndex === -1) {
        activeIndex = activeTrack ? currentQ.findIndex(t => t.mediaId === activeTrack.mediaId) : 0;
      }

      if (activeIndex === -1 || activeIndex >= currentQ.length - 1) {
        showToast('No hay canciones siguientes en la cola');
        return;
      }

      console.log(`[useAppController] 🧹 [handleClearUpcomingQueue] Vaciando pistas siguientes después de índice ${activeIndex} (${currentQ.length - 1 - activeIndex} pistas)`);
      isReorderingRef.current = true;

      await TrackPlayer.removeMediaItems(activeIndex + 1, currentQ.length);

      const updatedQueue = currentQ.slice(0, activeIndex + 1);
      setPlayQueue(updatedQueue);

      AsyncStorage.setItem('vulpis_player_state', JSON.stringify({
        currentSource: currentSourceRef.current,
        playQueue: sanitizeQueueForStorage(updatedQueue),
        activeTrackId: activeTrack?.mediaId ?? null,
        progressPosition: progress.position,
      })).catch(err => console.error('[useAppController] Error guardando estado tras vaciar cola:', err));

      setTimeout(() => {
        isReorderingRef.current = false;
      }, 500);

      showToast('Cola de reproducción vaciada');
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useAppController] ❌ Error al vaciar cola:', e);
      Alert.alert('Error', 'No se pudo vaciar la cola de reproducción.');
    }
  }, [activeTrack, progress.position, showToast]);

  // Bloquea el polling mientras el usuario arrastra (evita que setPlayQueue del interval sobreescriba la cola en tiempo real)
  const handleSetDragActive = useCallback((active) => {
    console.log(`[useAppController] 🎛️ Drag activo cambiado a: ${active}`);
    isReorderingRef.current = active;
  }, []);

  const handleReorderQueueState = useCallback((fromIndex, toIndex) => {
    handleMoveQueueItem(fromIndex, toIndex);
  }, [handleMoveQueueItem]);

  const handleSyncReorderNative = useCallback(async (finalQueue) => {
    // Ya no es necesario usar clear() destructivo; handleMoveQueueItem mueve nativamente en cada drop.
  }, []);

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
        let initialTracks = [];
        try {
          const stored = await AsyncStorage.getItem('vulpis_local_tracks');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.length > 0) {
              initialTracks = parsed;
              if (isMounted) {
                setLocalLibraryTracks(parsed);
                setHasCustomLocalTracks(true);
                setTracks(parsed);
              }
            }
          }
        } catch (storageErr) {
          console.error('[useAppController] Error al leer las pistas locales iniciales:', storageErr);
        }

        // Cargar el estado guardado del reproductor si existe
        let savedState = null;
        try {
          const storedState = await AsyncStorage.getItem('vulpis_player_state');
          if (storedState) {
            savedState = JSON.parse(storedState);
          }
        } catch (stateErr) {
          console.error('[useAppController] Error al leer el estado guardado del reproductor:', stateErr);
          await AsyncStorage.removeItem('vulpis_player_state').catch(() => {});
        }

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
            console.log('[useAppController] La fuente guardada es privada pero no se encontró ningún token, volviendo a local');
            sourceToRestore = 'local';
          }

          if (isMounted) {
            setCurrentSource(sourceToRestore);
            
            if (sourceToRestore === 'private') {
              setPlayQueue(savedState.playQueue);
              setTracks(savedState.tracksList || savedState.playQueue);
            } else {
              setPlayQueue(savedState.playQueue);
              setTracks(initialTracks);
            }
          }

          await TrackPlayer.setMediaItems(savedState.playQueue);
          
          // Buscar el índice de la pista activa
          let activeIndex = 0;
          if (savedState.activeTrackId) {
            const idx = savedState.playQueue.findIndex(t => t.mediaId === savedState.activeTrackId);
            if (idx !== -1) {
              activeIndex = idx;
            }
          }
          await TrackPlayer.skipToIndex(activeIndex);

          if (savedState.progressPosition && savedState.progressPosition > 0) {
            console.log(`[useAppController] Buscando posición guardada: ${savedState.progressPosition}`);
            await TrackPlayer.seekTo(savedState.progressPosition);
            if (isMounted) {
              const activeTrackItem = savedState.playQueue[activeIndex];
              setProgress({
                position: savedState.progressPosition,
                duration: activeTrackItem ? (activeTrackItem.duration || 0) : 0,
              });
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
          handleScanLocal({ silent: true }).catch(err => {
            console.log('[useAppController] Error en escaneo automático inicial:', err);
          });
        }, 300);

        console.log('[useAppController] ¡Configuración de TrackPlayer completada exitosamente!');
        
        sub1 = TrackPlayer.addEventListener(Event.MediaItemTransition, (event) => {
          // console.log('[DEBUG] TransiciónElementoMultimedia:', event);
        });
        sub2 = TrackPlayer.addEventListener(Event.IsPlayingChanged, (event) => {
          // console.log('[DEBUG] CambióReproduciendo:', event);
        });
        sub3 = TrackPlayer.addEventListener(Event.PlaybackStateChanged, (event) => {
          // console.log('[DEBUG] EstadoReproducciónCambió:', event);
        });

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

  const currentSourceRef = useRef(currentSource);
  const tracksRef = useRef(tracks);

  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

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

        setActiveTrack(prev => {
          if (!prev && !currentActive) return prev;
          if (prev && currentActive && prev.mediaId === currentActive.mediaId && prev.title === currentActive.title && prev.url === currentActive.url) {
            return prev;
          }
          return currentActive;
        });

        setIsPlaying(prev => (prev === currentPlaying ? prev : currentPlaying));
        setRepeatMode(prev => (prev === currentRepeat ? prev : currentRepeat));
        setIsShuffleActive(prev => (prev === currentShuffle ? prev : currentShuffle));

        // Solo sincronizar la cola de TrackPlayer cada 1 segundo (tick % 4 === 0) y NUNCA durante un reordenamiento activo
        if (!isReorderingRef.current && (tick % 4 === 0 || !playQueueRef.current || playQueueRef.current.length === 0)) {
          const currentQueue = TrackPlayer.getQueue();
          if (currentQueue && currentQueue.length > 0) {
            setPlayQueue(prev => {
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

        setProgress(prev => {
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
          
          const stateToSave = {
            currentSource: currentSourceRef.current,
            playQueue: sanitizeQueueForStorage(currentQueueSnapshot),
            activeTrackId: trackId,
            progressPosition: pos,
          };
          
          AsyncStorage.setItem('vulpis_player_state', JSON.stringify(stateToSave))
            .catch(err => console.error('[useAppController] Error al guardar el estado del reproductor:', err));
        }

      } catch (e) {
        console.log('[useAppController] Error actualizando estado de TrackPlayer:', e);
      }
    };

    updatePlayerState();
    const interval = setInterval(updatePlayerState, 250);

    return () => clearInterval(interval);
  }, [isPlayerInitialized]);

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

  // Almacenamiento en caché en segundo plano para archivos de Google Drive
  useEffect(() => {
    if (!isPlayerInitialized) return;
    if (!activeTrack) return;

    let isMounted = true;

    async function prefetchNextTrack() {
      try {
        const activeIndex = TrackPlayer.getActiveMediaItemIndex();
        if (activeIndex === null || activeIndex === -1) return;

        const currentQueue = TrackPlayer.getQueue();
        if (!currentQueue || currentQueue.length <= 1) return;

        // Calcular el siguiente índice
        let nextIndex = activeIndex + 1;
        if (nextIndex >= currentQueue.length) {
          // Si la repetición de cola está activada, volver a 0
          const repeatMode = TrackPlayer.getRepeatMode();
          if (repeatMode === RepeatMode.Queue) {
            nextIndex = 0;
          } else {
            return; // No hay siguiente pista
          }
        }

        const nextTrack = currentQueue[nextIndex];
        if (!nextTrack) return;

        // Verificar si la siguiente pista es de Drive y aún no está en caché
        if (nextTrack.mediaId.startsWith('drive-') && !nextTrack.url.startsWith('file://')) {
          const fileId = nextTrack.mediaId.replace('drive-', '');
          
          // Verificar si el archivo ya está en caché (para evitar solicitar token o iniciar la descarga si ya existe)
          const localUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          
          if (fileInfo.exists) {
            console.log(`[Buffering] La siguiente pista ya está guardada en caché local en: ${localUri}. Actualizando cola...`);
            const updatedTrack = { ...nextTrack, url: localUri };
            
            if (isMounted) {
              // Actualizar la cola nativa
              const latestQueue = TrackPlayer.getQueue();
              if (latestQueue && nextIndex < latestQueue.length && latestQueue[nextIndex].mediaId === nextTrack.mediaId) {
                await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
              }
              // Actualizar el estado
              setPlayQueue(prev => {
                const newQueue = [...prev];
                if (nextIndex < newQueue.length && newQueue[nextIndex].mediaId === nextTrack.mediaId) {
                  newQueue[nextIndex] = updatedTrack;
                }
                return newQueue;
              });
              setTracks(prev => prev.map(t => t.mediaId === nextTrack.mediaId ? updatedTrack : t));
            }
            return;
          }

          // De lo contrario, necesitamos descargarlo
          const token = await getStoredToken();
          if (!token) return;

          console.log(`[Buffering] Iniciando predescarga en segundo plano para: ${nextTrack.title}`);
          const downloadedUri = await downloadDriveFile(fileId, nextTrack.title, token);
          
          if (downloadedUri && isMounted) {
            console.log(`[Buffering] Predescarga en segundo plano finalizada: ${nextTrack.title}`);
            const updatedTrack = { ...nextTrack, url: downloadedUri };
            
            // Actualizar la cola nativa
            const latestQueue = TrackPlayer.getQueue();
            if (latestQueue && nextIndex < latestQueue.length && latestQueue[nextIndex].mediaId === nextTrack.mediaId) {
              await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
            }
            
            // Actualizar el estado
            setPlayQueue(prev => {
              const newQueue = [...prev];
              if (nextIndex < newQueue.length && newQueue[nextIndex].mediaId === nextTrack.mediaId) {
                newQueue[nextIndex] = updatedTrack;
              }
              return newQueue;
            });
            setTracks(prev => prev.map(t => t.mediaId === nextTrack.mediaId ? updatedTrack : t));
          }
        }
      } catch (err) {
        console.error('[Buffering] Error durante la predescarga:', err);
      }
    }

    prefetchNextTrack();

    return () => {
      isMounted = false;
    };
  }, [activeTrack, isPlayerInitialized]);

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
          const updatedTracks = trackListToLoad.map(t => {
            if (t.mediaId === item.mediaId) {
              return { ...t, url: localUri };
            }
            return t;
          });

          if (!playlistTracks) {
            setTracks(updatedTracks);
          }

          // Actualizar las URLs de las pistas de las listas de reproducción
          const updatedPlaylists = playlists.map(p => {
            const hasTrack = p.tracks.some(t => t.mediaId === item.mediaId);
            if (hasTrack) {
              return {
                ...p,
                tracks: p.tracks.map(t => t.mediaId === item.mediaId ? { ...t, url: localUri } : t)
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
            const newIdx = updatedTracks.findIndex(t => t.mediaId === item.mediaId);
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
