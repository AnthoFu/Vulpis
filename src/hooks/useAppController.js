import { useEffect, useState, useRef } from 'react';
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

  // Estados del menú lateral de navegación y de la fuente
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState('local'); // 'local' | 'private'
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);

  // Flag para evitar que el polling sobreescriba la cola durante un reordenamiento nativo
  const isReorderingRef = useRef(false);

  // Hooks personalizados para logica estandarizada y modular
  const { toast, showToast } = useToast();

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
        activeIndex = 0;
      }
      
      const uniqueId = `${item.mediaId}-queued-${Date.now()}`;
      const queuedItem = {
        ...item,
        mediaId: uniqueId,
      };

      console.log(`[useAppController] Agregando pista ${item.title} a la cola después del índice ${activeIndex}`);
      await TrackPlayer.insertMediaItem(activeIndex + 1, queuedItem);

      // Actualizar el estado de la cola de reproducción (playQueue)
      const updatedQueue = [...playQueue];
      updatedQueue.splice(activeIndex + 1, 0, queuedItem);
      setPlayQueue(updatedQueue);

      showToast(`Añadido a la cola: ${item.title}`);
    } catch (e) {
      console.error('[useAppController] Error al agregar pista a la cola:', e);
      Alert.alert('Error', 'No se pudo agregar la canción a la cola.');
    }
  };

  const handleRemoveFromQueue = async (item, index) => {
    try {
      console.log(`[useAppController] Eliminando pista de la cola en el índice ${index}: ${item.title}`);
      await TrackPlayer.removeMediaItem(index);
      
      const updatedQueue = [...playQueue];
      updatedQueue.splice(index, 1);
      setPlayQueue(updatedQueue);

      showToast(`Eliminado de la cola: ${item.title}`);
    } catch (e) {
      console.error('[useAppController] Error al eliminar pista de la cola:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción de la cola.');
    }
  };

  // Bloquea el polling mientras el usuario arrastra (evita que setPlayQueue del interval sobreescriba la cola en tiempo real)
  const handleSetDragActive = (active) => {
    isReorderingRef.current = active;
  };
  const handleReorderQueueState = (fromIndex, toIndex) => {
    setPlayQueue(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // Sincronización atómica con el reproductor nativo (solo se llama una vez al soltar)
  const handleSyncReorderNative = async (finalQueue) => {
    try {
      if (!finalQueue || finalQueue.length === 0) return;
      console.log(`[useAppController] Sincronizando cola reordenada con el reproductor nativo (${finalQueue.length} pistas)`);

      isReorderingRef.current = true;

      const currentIndex = finalQueue.findIndex(t => t.mediaId === activeTrack?.mediaId);
      await TrackPlayer.clear();
      await TrackPlayer.setMediaItems(finalQueue);
      if (currentIndex >= 0) {
        await TrackPlayer.skipToIndex(currentIndex);
      }

      // Dar tiempo al reproductor a estabilizarse antes de reanudar el polling
      setTimeout(() => {
        isReorderingRef.current = false;
      }, 600);

      AsyncStorage.setItem('vulpis_player_state', JSON.stringify({
        currentSource: currentSource,
        playQueue: finalQueue,
        tracksList: tracks,
        activeTrackId: activeTrack?.mediaId ?? null,
        progressPosition: progress.position,
      })).catch(err => console.error('[useAppController] Error guardando estado reordenado:', err));
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useAppController] Error al sincronizar cola nativa:', e);
    }
  };

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

    const updatePlayerState = () => {
      try {
        const currentActive = TrackPlayer.getActiveMediaItem();
        const currentPlaying = TrackPlayer.isPlaying();
        const currentProgress = TrackPlayer.getProgress();
        const currentRepeat = TrackPlayer.getRepeatMode();
        const currentShuffle = TrackPlayer.isShuffleEnabled();
        const currentQueue = TrackPlayer.getQueue();
        
        tick++;

        setActiveTrack(currentActive);
        setIsPlaying(currentPlaying);
        setRepeatMode(currentRepeat);
        setIsShuffleActive(currentShuffle);
        // No sobreescribir la cola si hay un reordenamiento nativo en progreso
        if (!isReorderingRef.current) {
          setPlayQueue(currentQueue || []);
        }
        setProgress({
          position: currentProgress?.position ?? 0,
          duration: currentProgress?.duration ?? 0,
        });

        // Verificación de persistencia del estado
        const pos = currentProgress?.position ?? 0;
        const trackId = currentActive?.mediaId ?? null;
        const queueLen = currentQueue ? currentQueue.length : 0;
        
        // Guardar si cambió la pista, o si el progreso avanzó >= 5 segundos, o si la longitud de la cola cambió
        const timeDiff = Math.abs(pos - lastSavedSec);
        if (trackId !== lastSavedTrackId || timeDiff >= 5 || queueLen !== lastSavedQueueLen) {
          lastSavedSec = pos;
          lastSavedTrackId = trackId;
          lastSavedQueueLen = queueLen;
          
          const stateToSave = {
            currentSource: currentSourceRef.current,
            playQueue: currentQueue || [],
            tracksList: tracksRef.current,
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
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(updatedTracks);
          
          const newIdx = updatedTracks.findIndex(t => t.mediaId === item.mediaId);
          await TrackPlayer.skipToIndex(newIdx !== -1 ? newIdx : index);
          await TrackPlayer.play();
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
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(trackListToLoad);
        await TrackPlayer.skipToIndex(index);
        await TrackPlayer.play();
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
    handleReorderQueueState,
    handleSyncReorderNative,
    handleSetDragActive,
    handleSourceChange,
    handleSelectTrack,
  };
}
