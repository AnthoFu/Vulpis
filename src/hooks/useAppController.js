import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Image } from 'react-native';
import TrackPlayer, { RepeatMode } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTracks } from '../constants/tracks';
import { getStoredToken } from '../services/drive';
import { smoothTrackTransition } from '../utils/crossfade';

// Hooks personalizados del ecosistema modular
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

/**
 * @typedef {Object} AppControllerResult
 * @property {import('react-native-safe-area-context').EdgeInsets} insets - Márgenes seguros de pantalla.
 * @property {string} defaultCover - URI local del asset de carátula por defecto.
 * @property {boolean} isPlayerInitialized - Si TrackPlayer completó la inicialización nativa.
 * @property {Object|null} activeTrack - Pista activa en reproducción.
 * @property {boolean} isPlaying - Indica si el reproductor está actualmente reproduciendo.
 * @property {{position: number, duration: number}} progress - Posición y duración en segundos.
 * @property {number} repeatMode - Modo de repetición actual (Off, Track, Queue).
 * @property {boolean} isShuffleActive - Indica si el modo aleatorio está activo.
 * @property {boolean} isFullPlayerVisible - Visibilidad de la vista expandida (PlayerCard).
 * @property {Function} setIsFullPlayerVisible - Setter de visibilidad de PlayerCard.
 * @property {boolean} startWithQueueVisible - Indica si PlayerCard debe abrirse mostrando la cola.
 * @property {Function} setStartWithQueueVisible - Setter para iniciar con la cola desplegada.
 * @property {Array} playQueue - Lista actual de canciones en la cola de reproducción.
 * @property {boolean} isDrawerOpen - Visibilidad del menú lateral de navegación.
 * @property {Function} setIsDrawerOpen - Setter de visibilidad del menú lateral.
 * @property {boolean} isSettingsOpen - Visibilidad del modal de ajustes generales.
 * @property {Function} setIsSettingsOpen - Setter de visibilidad de ajustes.
 * @property {string} currentSource - Fuente de datos activa ('local' | 'private' | 'playlists').
 * @property {Array} tracks - Lista de pistas visible en la biblioteca actual.
 * @property {boolean} isSourceChanging - Bandera de carga durante el cambio de fuente o descarga.
 * @property {Object} toast - Estado de la notificación emergente flotante.
 * @property {Function} showToast - Disparador de mensajes Toast.
 * @property {Array} playlists - Lista de todas las playlists personalizadas.
 * @property {Object} favoritesPlaylist - Lista especial automática de favoritos.
 * @property {Function} isFavoriteTrack - Verifica si una pista está en la lista de favoritos.
 * @property {Function} handleToggleFavorite - Alterna el estado de favorito de una pista.
 * @property {Function} handleCreatePlaylist - Crea una nueva playlist personalizada.
 * @property {Function} handleDeletePlaylist - Elimina una playlist existente.
 * @property {Function} handleAddTrackToPlaylist - Añade una pista a una playlist específica.
 * @property {Function} handleRemoveTrackFromPlaylist - Quita una pista de una playlist específica.
 * @property {boolean} hasCustomLocalTracks - Si el usuario escaneó pistas locales propias.
 * @property {Function} handleScanLocal - Dispara el escaneo de música en el dispositivo.
 * @property {Function} handleImportMp3 - Permite importar un archivo de audio mediante selector de documentos.
 * @property {Function} handleResetLocal - Restablece la biblioteca local a las pistas de demostración.
 * @property {Function} handleDeleteLocalTrack - Elimina permanentemente una pista del almacenamiento local.
 * @property {boolean} isDriveConnected - Indica si la cuenta de Google Drive está vinculada.
 * @property {string} googleClientId - Identificador del cliente OAuth 2.0.
 * @property {string} googleRedirectUri - URI de redirección para autenticación PKCE.
 * @property {boolean} isDriveLoading - Indica si hay sincronización de Drive en curso.
 * @property {Function} handleConnectDrive - Inicia el flujo de autenticación OAuth con Google.
 * @property {Function} handleDisconnectDrive - Revoca y limpia credenciales de Google Drive.
 * @property {Function} handleRefreshDrive - Recarga la lista de archivos de Google Drive.
 * @property {Function} handleUploadTrackToDrive - Sube un archivo seleccionado a Google Drive.
 * @property {Function} handleUploadLocalTrackToDrive - Sube una pista de la biblioteca local a Drive.
 * @property {Function} handleDeleteDriveTrack - Elimina un archivo remoto de Google Drive.
 * @property {Function} handleDownloadDriveTrack - Descarga y almacena localmente una pista de Drive.
 * @property {Function} handleAddToQueue - Añade una pista al final de la cola activa.
 * @property {Function} handleRemoveFromQueue - Elimina una pista de la cola nativa.
 * @property {Function} handleMoveQueueItem - Reordena elementos en la cola nativa.
 * @property {Function} handleClearUpcomingQueue - Vacía las pistas siguientes de la cola.
 * @property {Function} handleReorderQueueState - Actualiza el estado visual durante drag-and-drop.
 * @property {Function} handleSyncReorderNative - Aplica el reordenamiento visual en el motor nativo de TrackPlayer.
 * @property {Function} handleSetDragActive - Modifica la bandera de arrastre activo.
 * @property {Function} handleSourceChange - Cambia la fuente activa de música.
 * @property {Function} handleSelectTrack - Selecciona y reproduce una pista resolviendo descargas en demanda.
 * @property {boolean} isTimerActive - Si el temporizador de apagado está activo.
 * @property {string} timerMode - Modo del temporizador ('minutes' | 'end_of_track').
 * @property {number} secondsRemaining - Segundos restantes antes de pausar la música.
 * @property {string} timeRemainingFormatted - Tiempo restante formateado en texto (ej. "14m 20s").
 * @property {Function} startSleepTimer - Inicia un temporizador de apagado progresivo.
 * @property {Function} cancelSleepTimer - Cancela el temporizador activo.
 * @property {boolean} isSleepTimerModalOpen - Visibilidad del modal de temporizador de apagado.
 * @property {Function} setIsSleepTimerModalOpen - Setter de visibilidad del modal de temporizador.
 * @property {Object} crossfadeSettings - Configuración actual de fundido cruzado.
 * @property {Function} handleUpdateCrossfade - Actualiza la configuración de fundido cruzado.
 * @property {Object} replayGainSettings - Configuración actual de normalización ReplayGain.
 * @property {Function} handleUpdateReplayGain - Actualiza la configuración de ReplayGain.
 */

/**
 * Hook orquestador principal de la aplicación Vulpis (`useAppController`).
 *
 * Actúa como punto central de coordinación de la arquitectura, conectando los hooks
 * de dominio (reproducción nativa, biblioteca local, Google Drive, listas de reproducción,
 * ajustes acústicos y persistencia segura) con la capa de presentación visual (`App.js`).
 *
 * @returns {AppControllerResult} Objeto con todos los estados y manejadores del ciclo de vida del reproductor.
 */
export default function useAppController() {
  const insets = useSafeAreaInsets();
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  // 1. Estados centrales de reproducción
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [playQueue, setPlayQueue] = useState([]);

  // Referencia mutable de la cola de reproducción para lecturas directas sin desactualización
  const playQueueRef = useRef(playQueue);
  playQueueRef.current = playQueue;

  // 2. Estados de modales y vistas auxiliares
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [startWithQueueVisible, setStartWithQueueVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);

  // 3. Estados de la fuente de pistas ('local' | 'private' | 'playlists')
  const [currentSource, setCurrentSource] = useState('local');
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);

  // 4. Banderas y referencias atómicas para control de concurrencia
  const isReorderingRef = useRef(false);
  const currentSourceRef = useRef(currentSource);
  const tracksRef = useRef(tracks);

  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Hook de notificaciones emergentes (Toast)
  const { toast, showToast } = useToast();

  // Hook de persistencia segura (AsyncStorage / CursorWindow safe)
  const { savePlayerState, loadPlayerState, loadStoredLocalTracks } = usePlayerPersistence();

  // Hook de ajustes acústicos (Crossfade y ReplayGain)
  const {
    crossfadeSettings,
    crossfadeSettingsRef,
    handleUpdateCrossfade,
    replayGainSettings,
    replayGainSettingsRef,
    handleUpdateReplayGain,
  } = useAudioSettings({ activeTrack, showToast });

  // Hook de temporizador de apagado (Sleep Timer)
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

  // Hook de gestión de listas de reproducción y favoritos
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

  // Hook de biblioteca local (escaneo de almacenamiento y archivos MP3)
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

  // Hook de integración con Google Drive (OAuth 2.0 PKCE, listado y subida)
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

  // Hook de manipulación de cola de reproducción (adición, borrado, drag-and-drop nativo)
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

  // Hook de precarga transparente en segundo plano para canciones de Google Drive
  useDrivePrefetch({
    activeTrack,
    isPlayerInitialized,
    setPlayQueue,
    setTracks,
    downloadDriveFile,
  });

  // Hook de inicialización nativa y recuperación de estado persistido
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

  // Hook de sincronización en tiempo real (polling JSI a 250ms)
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

  /**
   * Respaldo automático: si la cola queda vacía pero la biblioteca contiene pistas,
   * se re-puebla automáticamente TrackPlayer para garantizar continuidad musical.
   */
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

  /**
   * Cambia la fuente activa de pistas ('local' | 'private' | 'playlists')
   * gestionando la carga de archivos o credenciales correspondientes.
   */
  const handleSourceChange = useCallback(async (source) => {
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
  }, [currentSource, isSourceChanging, localLibraryTracks, loadDriveFiles, setIsDriveConnected]);

  /**
   * Selecciona una pista para reproducción inmediata.
   * Si la canción proviene de Google Drive y no está en caché local, la descarga
   * previamente y actualiza las listas de reproducción asociadas para persistir la URI local.
   */
  const handleSelectTrack = useCallback(async (item, index, playlistTracks) => {
    const trackListToLoad = playlistTracks || tracks;

    // Caso 1: Pista remota de Google Drive pendiente de descarga
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

          // Actualizar las URIs locales dentro de todas las playlists que contengan esta pista
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
      // Caso 2: Pista local o ya guardada en caché
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
  }, [tracks, showToast, downloadDriveFile, playlists, setPlaylists, crossfadeSettingsRef]);

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
