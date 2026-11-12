import { useEffect, useState, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { Alert, Image } from 'react-native';
import TrackPlayer, { RepeatMode } from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { localTracks } from '../constants/tracks';
import { getStoredToken } from '../services/drive';
import { smoothTrackTransition } from '../utils/crossfade';

// Hooks personalizados del ecosistema modular
import useToast from './useToast';
import usePlaylists from './usePlaylists';
import useLocalLibrary from './useLocalLibrary';
import useGoogleDrive from './useGoogleDrive';
import useSleepTimer, { SleepTimerMode } from './useSleepTimer';
import useAudioSettings from './useAudioSettings';
import useEqualizer from './useEqualizer';
import usePlaybackHistory from './usePlaybackHistory';
import usePlayerPersistence from './usePlayerPersistence';
import useQueueController from './useQueueController';
import useDrivePrefetch from './useDrivePrefetch';
import usePlayerInitializer from './usePlayerInitializer';
import usePlayerStateSync, { ProgressState } from './usePlayerStateSync';

import { Track } from '../models/Track';
import { Playlist } from '../models/Playlist';
import { CrossfadeSettings, ReplayGainSettings } from '../models/AudioSettings';
import { EqualizerSettings, EqualizerPresetId } from '../models/EqualizerSettings';
import { PlaybackHistoryItem } from '../models/History';

export type AudioSource = 'local' | 'private' | string;

export interface AppControllerResult {
  insets: EdgeInsets;
  defaultCover: string;
  isPlayerInitialized: boolean;
  activeTrack: Track | null;
  isPlaying: boolean;
  progress: ProgressState;
  repeatMode: RepeatMode;
  isShuffleActive: boolean;
  isFullPlayerVisible: boolean;
  setIsFullPlayerVisible: Dispatch<SetStateAction<boolean>>;
  startWithQueueVisible: boolean;
  setStartWithQueueVisible: Dispatch<SetStateAction<boolean>>;
  playQueue: Track[];
  isDrawerOpen: boolean;
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  currentSource: string;
  tracks: Track[];
  isSourceChanging: boolean;
  toast: string | null;
  showToast: (message: string) => void;
  playlists: Playlist[];
  favoritesPlaylist: Playlist | null;
  isFavoriteTrack: (mediaId?: string | null) => boolean;
  handleToggleFavorite: (track?: Track | null) => Promise<boolean>;
  handleCreatePlaylist: (name: string) => Promise<Playlist | null>;
  handleDeletePlaylist: (id: string) => Promise<void>;
  handleAddTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  handleRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  hasCustomLocalTracks: boolean;
  handleScanLocal: (options?: { silent?: boolean }) => Promise<Track[]>;
  handleImportMp3: () => Promise<void>;
  handleResetLocal: () => Promise<void>;
  handleDeleteLocalTrack: (track: Track) => Promise<void>;
  isDriveConnected: boolean;
  googleClientId: string;
  googleRedirectUri: string;
  isDriveLoading: boolean;
  handleConnectDrive: (clientId: string, redirectUri: string) => Promise<void>;
  handleDisconnectDrive: () => Promise<void>;
  handleRefreshDrive: () => Promise<void>;
  handleUploadTrackToDrive: () => Promise<void>;
  handleUploadLocalTrackToDrive: (track: Track) => Promise<void>;
  handleDeleteDriveTrack: (track: Track) => Promise<void>;
  handleDownloadDriveTrack: (track: Track) => Promise<void>;
  handleAddToQueue: (item: Track) => Promise<void>;
  handleRemoveFromQueue: (item: Track, index: number) => Promise<void>;
  handleMoveQueueItem: (fromIndex: number, toIndex: number) => Promise<void>;
  handleClearUpcomingQueue: () => Promise<void>;
  handleReorderQueueState: (fromIndex: number, toIndex: number) => void;
  handleSyncReorderNative: (_finalQueue: Track[]) => Promise<void>;
  handleSetDragActive: (active: boolean) => void;
  handleSourceChange: (source: string) => Promise<void>;
  handleSelectTrack: (item: Track, index: number, playlistTracks?: Track[]) => Promise<void>;
  isTimerActive: boolean;
  timerMode: SleepTimerMode;
  secondsRemaining: number;
  timeRemainingFormatted: string | null;
  startSleepTimer: (mode: SleepTimerMode | string) => void;
  cancelSleepTimer: () => void;
  isSleepTimerModalOpen: boolean;
  setIsSleepTimerModalOpen: Dispatch<SetStateAction<boolean>>;
  crossfadeSettings: CrossfadeSettings;
  handleUpdateCrossfade: (newSettings: CrossfadeSettings) => Promise<void>;
  replayGainSettings: ReplayGainSettings;
  handleUpdateReplayGain: (newSettings: ReplayGainSettings) => Promise<void>;
  equalizerSettings: EqualizerSettings;
  isEqualizerOpen: boolean;
  setIsEqualizerOpen: Dispatch<SetStateAction<boolean>>;
  isSystemEqualizerAvailable: boolean;
  handleToggleEqualizer: (enabled: boolean) => Promise<void>;
  handleSelectPreset: (presetId: EqualizerPresetId) => Promise<void>;
  handleUpdateBandGain: (bandIndex: number, gain: number) => Promise<void>;
  handleUpdateBassBoost: (bassBoost: number) => Promise<void>;
  handleResetEqualizer: () => Promise<void>;
  handleOpenSystemEqualizer: () => Promise<void>;
  historyItems: PlaybackHistoryItem[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: Dispatch<SetStateAction<boolean>>;
  recordPlayback: (track: Track, duration?: number) => Promise<void>;
  handleRemoveHistoryItem: (id: string) => Promise<void>;
  handleClearHistory: () => Promise<void>;
}

/**
 * Hook orquestador principal de la aplicación Vulpis (`useAppController`).
 *
 * Actúa como punto central de coordinación de la arquitectura, conectando los hooks
 * de dominio (reproducción nativa, biblioteca local, Google Drive, listas de reproducción,
 * ajustes acústicos y persistencia segura) con la capa de presentación visual (`App.js`).
 */
export default function useAppController(): AppControllerResult {
  const insets = useSafeAreaInsets();
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  // 1. Estados centrales de reproducción
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ position: 0, duration: 0 });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [playQueue, setPlayQueue] = useState<Track[]>([]);

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
  const [tracks, setTracks] = useState<Track[]>(localTracks);
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

  // Hook de ecualizador acústico de 5 bandas
  const {
    equalizerSettings,
    equalizerSettingsRef,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isSystemEqualizerAvailable,
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
    handleOpenSystemEqualizer,
  } = useEqualizer({ showToast });

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

  // Hook de historial de reproducción y scrobbling automático
  const {
    historyItems,
    isHistoryOpen,
    setIsHistoryOpen,
    recordPlayback,
    handleRemoveHistoryItem,
    handleClearHistory,
  } = usePlaybackHistory({
    activeTrack,
    isPlaying,
    position: progress.position,
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
    equalizerSettingsRef,
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
          await TrackPlayer.setMediaItems(tracks as any);
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
  const handleSourceChange = useCallback(async (source: string) => {
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
  const handleSelectTrack = useCallback(async (item: Track, index: number, playlistTracks?: Track[]) => {
    const trackListToLoad = playlistTracks || tracks;

    // Caso 1: Pista remota de Google Drive pendiente de descarga
    if (item.mediaId.startsWith('drive-') && !item.url.startsWith('file://')) {
      try {
        if (showToast) showToast(`Descargando canción: ${item.title}...`);
        setIsSourceChanging(true);

        const token = await getStoredToken();
        if (!token) throw new Error('No hay token de Google Drive');
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
            await TrackPlayer.setMediaItems(updatedTracks as any);
            const newIdx = updatedTracks.findIndex((t) => t.mediaId === item.mediaId);
            await TrackPlayer.skipToIndex(newIdx !== -1 ? newIdx : index);
            TrackPlayer.play();
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
          await TrackPlayer.setMediaItems(trackListToLoad as any);
          await TrackPlayer.skipToIndex(index);
          TrackPlayer.play();
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
    equalizerSettings,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isSystemEqualizerAvailable,
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
    handleOpenSystemEqualizer,
    historyItems,
    isHistoryOpen,
    setIsHistoryOpen,
    recordPlayback,
    handleRemoveHistoryItem,
    handleClearHistory,
  };
}
