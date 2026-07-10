import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  StatusBar,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { PlayerCommand, Event, RepeatMode } from '@rntp/player';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
import MiniPlayer from './src/components/MiniPlayer';
import QueueList from './src/components/QueueList';
import SidebarDrawer from './src/components/SidebarDrawer';
import { GOOGLE_OAUTH_CONFIG } from './src/constants/config';
import { localTracks, privateTracks } from './src/constants/tracks';
import { extractMetadata } from './src/utils/metadata';
import {
  getGoogleConfig,
  saveGoogleConfig,
  getStoredToken,
  signInWithGoogle,
  fetchDriveMp3Files,
  mapDriveFileToTrack,
  clearAllCredentials,
  getDriveRedirectUrl,
} from './src/utils/drive';

function MainApp() {
  const insets = useSafeAreaInsets();
  const defaultCover = Image.resolveAssetSource(require('./assets/default-cover.jpg')).uri;
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [playQueue, setPlayQueue] = useState([]);

  // Navigation Drawer & Source states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState('local'); // 'local' | 'private'
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);

  // Google Drive Integration States
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(GOOGLE_OAUTH_CONFIG.clientId);
  const [googleRedirectUri, setGoogleRedirectUri] = useState(GOOGLE_OAUTH_CONFIG.redirectUri);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  // Local library tracks & customization state
  const [localLibraryTracks, setLocalLibraryTracks] = useState(localTracks);
  const [hasCustomLocalTracks, setHasCustomLocalTracks] = useState(false);

  // Custom toast notification & queue management
  const [playlists, setPlaylists] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Playlists Helper Functions
  useEffect(() => {
    async function loadPlaylists() {
      try {
        const stored = await AsyncStorage.getItem('vulpis_playlists');
        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      } catch (err) {
        console.error('[App] Error loading playlists:', err);
      }
    }
    loadPlaylists();
  }, []);

  const handleCreatePlaylist = async (name) => {
    if (!name || name.trim() === '') return null;
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    showToast(`Playlist "${name}" creada`);
    return newPlaylist;
  };

  const handleDeletePlaylist = async (id) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    showToast('Playlist eliminada');
  };

  const handleAddTrackToPlaylist = async (playlistId, track) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        if (p.tracks.some((t) => t.mediaId === track.mediaId)) {
          showToast('La canción ya está en esta playlist');
          return p;
        }
        showToast(`Añadida a: ${p.name}`);
        return {
          ...p,
          tracks: [...p.tracks, track],
        };
      }
      return p;
    });
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
  };

  const handleRemoveTrackFromPlaylist = async (playlistId, trackId) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: p.tracks.filter((t) => t.mediaId !== trackId),
        };
      }
      return p;
    });
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    showToast('Canción eliminada de la playlist');
  };

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

      console.log(`[App] Adding track ${item.title} to queue after index ${activeIndex}`);
      await TrackPlayer.insertMediaItem(activeIndex + 1, queuedItem);

      // Update playQueue state
      const updatedQueue = [...playQueue];
      updatedQueue.splice(activeIndex + 1, 0, queuedItem);
      setPlayQueue(updatedQueue);

      showToast(`Añadido a la cola: ${item.title}`);
    } catch (e) {
      console.error('[App] Error adding track to queue:', e);
      Alert.alert('Error', 'No se pudo agregar la canción a la cola.');
    }
  };

  const handleRemoveFromQueue = async (item, index) => {
    try {
      console.log(`[App] Removing track from queue at index ${index}: ${item.title}`);
      await TrackPlayer.removeMediaItem(index);
      
      const updatedQueue = [...playQueue];
      updatedQueue.splice(index, 1);
      setPlayQueue(updatedQueue);

      showToast(`Eliminado de la cola: ${item.title}`);
    } catch (e) {
      console.error('[App] Error removing track from queue:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción de la cola.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let sub1, sub2, sub3;

    async function init() {
      try {
        console.log('[App] Initializing TrackPlayer...');
        try {
          await TrackPlayer.setupPlayer({});
        } catch (e) {
          console.log('[App] Player ya estaba configurado, ignorando error:', e.message);
        }
        
        console.log('[App] Setting Player commands/capabilities...');
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
          ],
        });
        
        console.log('[App] Setting media items into player queue...');
        
        // Load custom local tracks from storage if they exist
        let initialTracks = localTracks;
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
          console.error('[App] Error reading initial local tracks:', storageErr);
        }

        // Now load saved player state if it exists
        let savedState = null;
        try {
          const storedState = await AsyncStorage.getItem('vulpis_player_state');
          if (storedState) {
            savedState = JSON.parse(storedState);
          }
        } catch (stateErr) {
          console.error('[App] Error reading saved player state:', stateErr);
        }

        // Check if we have a stored token for Drive
        let hasDriveToken = false;
        try {
          const token = await getStoredToken();
          if (token) {
            hasDriveToken = true;
          }
        } catch (tokenErr) {
          console.error('[App] Error checking Drive token:', tokenErr);
        }

        await TrackPlayer.clear();

        if (savedState && savedState.playQueue && savedState.playQueue.length > 0) {
          console.log('[App] Restoring saved player state...');
          
          let sourceToRestore = savedState.currentSource || 'local';
          if (sourceToRestore === 'private' && !hasDriveToken) {
            console.log('[App] Saved source is private but no token found, falling back to local');
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
          
          // Find the index of active track
          let activeIndex = 0;
          if (savedState.activeTrackId) {
            const idx = savedState.playQueue.findIndex(t => t.mediaId === savedState.activeTrackId);
            if (idx !== -1) {
              activeIndex = idx;
            }
          }
          await TrackPlayer.skipToIndex(activeIndex);

          if (savedState.progressPosition && savedState.progressPosition > 0) {
            console.log(`[App] Seeking to saved position: ${savedState.progressPosition}`);
            await TrackPlayer.seekTo(savedState.progressPosition);
            if (isMounted) {
              const activeTrackItem = savedState.playQueue[activeIndex];
              setProgress({
                position: savedState.progressPosition,
                duration: activeTrackItem ? (activeTrackItem.duration || 0) : 0,
              });
            }
          }
        } else {
          // Default setup
          await TrackPlayer.setMediaItems(initialTracks);
          await TrackPlayer.skipToIndex(0);
          if (isMounted) {
            setPlayQueue(initialTracks);
          }
        }

        console.log('[App] TrackPlayer setup completed successfully!');
        
        sub1 = TrackPlayer.addEventListener(Event.MediaItemTransition, (event) => {
          console.log('[DEBUG] MediaItemTransition:', event);
        });
        sub2 = TrackPlayer.addEventListener(Event.IsPlayingChanged, (event) => {
          console.log('[DEBUG] IsPlayingChanged:', event);
        });
        sub3 = TrackPlayer.addEventListener(Event.PlaybackStateChanged, (event) => {
          console.log('[DEBUG] PlaybackStateChanged:', event);
        });

        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      } catch (err) {
        console.error('[App] Critical Player setup error:', err);
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

  // Load Google Drive configuration on app start
  useEffect(() => {
    async function loadGoogleConfigData() {
      try {
        const config = await getGoogleConfig();
        setGoogleClientId(config.clientId);
        setGoogleRedirectUri(config.redirectUri);

        const token = await getStoredToken();
        if (token) {
          setIsDriveConnected(true);
        }
      } catch (err) {
        console.error('[App] Error loading initial Google Drive config:', err);
      }
    }
    loadGoogleConfigData();
  }, []);

  const loadDriveFiles = async (token, forceUpdatePlayer = false) => {
    setIsDriveLoading(true);
    setIsSourceChanging(true);
    try {
      const files = await fetchDriveMp3Files(token);
      const driveTracks = await Promise.all(
        files.map(async (file) => {
          const resolvedUrl = await getDriveRedirectUrl(file.id, token);
          return mapDriveFileToTrack(file, token, defaultCover, resolvedUrl);
        })
      );
      
      setTracks(driveTracks);
      
      // Update the TrackPlayer queue ONLY if forceUpdatePlayer is true AND there is no active track playing
      if (forceUpdatePlayer) {
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
      console.error('[App] Error loading Drive files:', err);
      if (err.message === 'AUTH_EXPIRED') {
        setIsDriveConnected(false);
        setTracks([]);
        Alert.alert('Sesión Expirada', 'Tu sesión de Google Drive ha expirado. Por favor, conéctate de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudieron obtener las canciones de Google Drive.');
      }
    } finally {
      setIsDriveLoading(false);
      setIsSourceChanging(false);
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
      console.error('[App] Connect Google Drive error:', err);
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
              console.error('[App] Disconnect error:', err);
            } finally {
              setIsDriveLoading(false);
            }
          }
        }
      ]
    );
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
        if (tick % 8 === 0) { // log only once every 2 seconds
          console.log('[DEBUG-POLL]', {
            activeTrack: currentActive,
            state: TrackPlayer.getPlaybackState(),
            isPlaying: currentPlaying,
            position: currentProgress?.position,
            repeatMode: currentRepeat,
            isShuffleActive: currentShuffle,
            playQueueLength: currentQueue?.length,
          });
        }

        setActiveTrack(currentActive);
        setIsPlaying(currentPlaying);
        setRepeatMode(currentRepeat);
        setIsShuffleActive(currentShuffle);
        setPlayQueue(currentQueue || []);
        setProgress({
          position: currentProgress?.position ?? 0,
          duration: currentProgress?.duration ?? 0,
        });

        // State persistence check
        const pos = currentProgress?.position ?? 0;
        const trackId = currentActive?.mediaId ?? null;
        const queueLen = currentQueue ? currentQueue.length : 0;
        
        // Save if track changed, or if progress moved by >= 5 seconds, or if queue length changed
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
            .catch(err => console.error('[App] Error saving player state:', err));
        }

      } catch (e) {
        console.log('[App] Error actualizando estado de TrackPlayer:', e);
      }
    };

    updatePlayerState();
    const interval = setInterval(updatePlayerState, 250);

    return () => clearInterval(interval);
  }, [isPlayerInitialized]);

  // Automatically restore library tracks if the play queue becomes completely empty
  useEffect(() => {
    if (!isPlayerInitialized || isSourceChanging) return;
    
    if (playQueue.length === 0 && tracks && tracks.length > 0) {
      console.log('[App] Queue is empty. Automatically restoring library tracks...');
      const restoreLibrary = async () => {
        try {
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(tracks);
          await TrackPlayer.skipToIndex(0);
        } catch (err) {
          console.error('[App] Error restoring library tracks:', err);
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

  // Helper to save local tracks to storage & sync with state and player
  const saveLocalTracks = async (newTracksList) => {
    setLocalLibraryTracks(newTracksList);
    setHasCustomLocalTracks(true);
    await AsyncStorage.setItem('vulpis_local_tracks', JSON.stringify(newTracksList));
    
    if (currentSource === 'local') {
      setTracks(newTracksList);
      
      try {
        const active = TrackPlayer.getActiveMediaItem();
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(newTracksList);
        
        if (active) {
          const idx = newTracksList.findIndex(t => t.mediaId === active.mediaId);
          if (idx !== -1) {
            await TrackPlayer.skipToIndex(idx);
          } else {
            await TrackPlayer.skipToIndex(0);
          }
        } else {
          await TrackPlayer.skipToIndex(0);
        }
      } catch (err) {
        console.error('[saveLocalTracks] Error synchronizing TrackPlayer:', err);
      }
    }
  };

  // Scan local audio files on the device using expo-media-library
  const handleScanLocal = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu biblioteca de medios para buscar archivos de audio.'
        );
        return;
      }

      setIsSourceChanging(true);
      
      let media = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.audio],
        first: 100, // retrieve up to 100 tracks
      });

      const assetsList = media.assets.filter(
        asset => asset.filename && asset.filename.toLowerCase().endsWith('.mp3')
      );

      if (assetsList.length === 0) {
        Alert.alert('Escaneo Completado', 'No se encontraron archivos .mp3 en el dispositivo.');
        setIsSourceChanging(false);
        return;
      }

      const newTracks = [];
      for (let i = 0; i < assetsList.length; i++) {
        const asset = assetsList[i];
        const meta = await extractMetadata(asset.uri);
        newTracks.push({
          mediaId: asset.id || `local-scanned-${i}-${Date.now()}`,
          url: asset.uri,
          title: meta.title || asset.filename.replace(/\.mp3$/i, ''),
          artist: meta.artist || 'Audio Escaneado',
          artworkUrl: meta.artworkUrl || defaultCover,
        });
      }

      await saveLocalTracks(newTracks);
      Alert.alert(
        'Escaneo Completado',
        `Se encontraron y cargaron ${newTracks.length} archivos .mp3 en tu biblioteca local.`
      );
    } catch (e) {
      console.error('Error scanning local audio:', e);
      Alert.alert('Error', 'Hubo un problema al escanear los archivos locales.');
    } finally {
      setIsSourceChanging(false);
    }
  };

  // Import specific MP3 files from device storage using expo-document-picker
  const handleImportMp3 = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg', // MP3 mime type
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (res.canceled) return;

      setIsSourceChanging(true);
      
      const importedTracks = [];
      for (let i = 0; i < res.assets.length; i++) {
        const asset = res.assets[i];
        const meta = await extractMetadata(asset.uri);
        importedTracks.push({
          mediaId: `imported-${Date.now()}-${i}`,
          url: asset.uri,
          title: meta.title || asset.name.replace(/\.mp3$/i, ''),
          artist: meta.artist || 'Archivo Importado',
          artworkUrl: meta.artworkUrl || defaultCover,
        });
      }

      // Append to existing local library
      const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
      const updatedTracks = [...existingCustom, ...importedTracks];
      
      await saveLocalTracks(updatedTracks);
      Alert.alert(
        'Importación Exitosa',
        `Se han importado ${importedTracks.length} canción(es) a la biblioteca local.`
      );
    } catch (e) {
      console.error('Error importing MP3 file:', e);
      Alert.alert('Error', 'No se pudo importar el archivo MP3.');
    } finally {
      setIsSourceChanging(false);
    }
  };

  // Clear custom local library tracks and fall back to hardcoded default demo ones
  const handleResetLocal = async () => {
    Alert.alert(
      'Restablecer Biblioteca',
      '¿Estás seguro de que quieres restablecer la biblioteca local? Esto eliminará tus canciones importadas/escaneadas y volverá a las canciones de prueba.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setIsSourceChanging(true);
            try {
              await AsyncStorage.removeItem('vulpis_local_tracks');
              setLocalLibraryTracks(localTracks);
              setHasCustomLocalTracks(false);
              
              if (currentSource === 'local') {
                setTracks(localTracks);
                await TrackPlayer.clear();
                await TrackPlayer.setMediaItems(localTracks);
                await TrackPlayer.skipToIndex(0);
              }
            } catch (e) {
              console.error('Error resetting local tracks:', e);
            } finally {
              setIsSourceChanging(false);
            }
          }
        }
      ]
    );
  };

  const downloadDriveFile = async (fileId, title, accessToken) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const localUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        console.log('[Drive] File already cached locally:', localUri);
        return localUri;
      }
      
      console.log('[Drive] Downloading file to cache:', localUri);
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
      console.log('[Drive] File downloaded successfully:', uri);
      return uri;
    } catch (error) {
      console.error('[Drive] Error downloading file:', error);
      return null;
    }
  };

  // Background Buffering for Google Drive files
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

        // Calculate next index
        let nextIndex = activeIndex + 1;
        if (nextIndex >= currentQueue.length) {
          // If repeat queue is on, wrap around to 0
          const repeatMode = TrackPlayer.getRepeatMode();
          if (repeatMode === RepeatMode.Queue) {
            nextIndex = 0;
          } else {
            return; // No next track
          }
        }

        const nextTrack = currentQueue[nextIndex];
        if (!nextTrack) return;

        // Check if next track is a Drive track and not yet cached
        if (nextTrack.mediaId.startsWith('drive-') && !nextTrack.url.startsWith('file://')) {
          const fileId = nextTrack.mediaId.replace('drive-', '');
          
          // Check if file is already in Cache (to avoid requesting token or starting download if it already exists)
          const localUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          
          if (fileInfo.exists) {
            console.log(`[Buffering] Next track is already cached locally at: ${localUri}. Updating queue...`);
            const updatedTrack = { ...nextTrack, url: localUri };
            
            if (isMounted) {
              // Update native queue
              const latestQueue = TrackPlayer.getQueue();
              if (latestQueue && nextIndex < latestQueue.length && latestQueue[nextIndex].mediaId === nextTrack.mediaId) {
                await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
              }
              // Update state
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

          // Otherwise, we need to download it
          const token = await getStoredToken();
          if (!token) return;

          console.log(`[Buffering] Starting background pre-download for: ${nextTrack.title}`);
          const downloadedUri = await downloadDriveFile(fileId, nextTrack.title, token);
          
          if (downloadedUri && isMounted) {
            console.log(`[Buffering] Background pre-download finished: ${nextTrack.title}`);
            const updatedTrack = { ...nextTrack, url: downloadedUri };
            
            // Update native queue
            const latestQueue = TrackPlayer.getQueue();
            if (latestQueue && nextIndex < latestQueue.length && latestQueue[nextIndex].mediaId === nextTrack.mediaId) {
              await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
            }
            
            // Update state
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
        console.error('[Buffering] Error during prefetch:', err);
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

          // Update playlists track URLs
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
          
          console.log('[App] Loading track with local cached file:', localUri);
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(updatedTracks);
          
          const newIdx = updatedTracks.findIndex(t => t.mediaId === item.mediaId);
          await TrackPlayer.skipToIndex(newIdx !== -1 ? newIdx : index);
          await TrackPlayer.play();
        } else {
          Alert.alert('Error', 'No se pudo descargar el archivo de Google Drive.');
        }
      } catch (err) {
        console.error('[App] Error in handleSelectTrack download:', err);
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
        console.error('[App] Error selecting track:', e);
      }
    }
  };

  if (!isPlayerInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando Vulpis Player...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      
      {toast && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top + 10, 40) }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      
      <QueueList
        activeTrack={activeTrack}
        tracks={tracks}
        playQueue={playQueue}
        isLoading={isSourceChanging}
        currentSource={currentSource}
        onScanLocal={handleScanLocal}
        onImportMp3={handleImportMp3}
        onResetLocal={handleResetLocal}
        hasCustomLocalTracks={hasCustomLocalTracks}
        onAddToQueue={handleAddToQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        isDriveConnected={isDriveConnected}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onRefreshDrive={handleRefreshDrive}
        isDriveLoading={isDriveLoading}
        googleClientId={googleClientId}
        googleRedirectUri={googleRedirectUri}
        onSelectTrack={handleSelectTrack}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
        onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20) + (activeTrack ? 80 : 0),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }}
        ListHeaderComponent={
          <Header onMenuPress={() => setIsDrawerOpen(true)} />
        }
      />

      {/* Floating MiniPlayer */}
      <MiniPlayer
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        position={progress.position}
        duration={progress.duration}
        onPress={() => setIsFullPlayerVisible(true)}
        tracks={tracks}
        playQueue={playQueue}
        onSelectTrack={handleSelectTrack}
        isShuffleActive={isShuffleActive}
      />

      {/* Full Screen Player Modal */}
      <Modal
        visible={isFullPlayerVisible}
        animationType="slide"
        onRequestClose={() => setIsFullPlayerVisible(false)}
      >
        <PlayerCard
          activeTrack={activeTrack}
          isPlaying={isPlaying}
          position={progress.position}
          duration={progress.duration}
          repeatMode={repeatMode}
          isShuffleActive={isShuffleActive}
          tracks={tracks}
          playQueue={playQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClose={() => setIsFullPlayerVisible(false)}
          onSelectTrack={handleSelectTrack}
        />
      </Modal>

      {/* Navigation Drawer Menu */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentSource={currentSource}
        onSelectSource={handleSourceChange}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 99999,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8F9E',
    marginTop: 15,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
