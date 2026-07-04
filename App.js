import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { PlayerCommand, Event, RepeatMode } from '@rntp/player';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
import MiniPlayer from './src/components/MiniPlayer';
import QueueList from './src/components/QueueList';
import SidebarDrawer from './src/components/SidebarDrawer';
import { localTracks, privateTracks, publicTracks } from './src/constants/tracks';

function MainApp() {
  const insets = useSafeAreaInsets();
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
  const [currentSource, setCurrentSource] = useState('local'); // 'local' | 'private' | 'public'
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);

  // Local library tracks & customization state
  const [localLibraryTracks, setLocalLibraryTracks] = useState(localTracks);
  const [hasCustomLocalTracks, setHasCustomLocalTracks] = useState(false);

  // Custom toast notification & queue management
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
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

        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(initialTracks);
        await TrackPlayer.skipToIndex(0);

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

  // Polling JSI Getters para sincronizar el estado en Android
  useEffect(() => {
    if (!isPlayerInitialized) return;
    
    let tick = 0;

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
      } catch (e) {
        console.log('[App] Error actualizando estado de TrackPlayer:', e);
      }
    };

    updatePlayerState();
    const interval = setInterval(updatePlayerState, 250);

    return () => clearInterval(interval);
  }, [isPlayerInitialized]);

  const handleSourceChange = async (source) => {
    if (source === currentSource || isSourceChanging) return;
    setIsSourceChanging(true);
    setCurrentSource(source);
    
    let selectedQueue = [];
    if (source === 'local') selectedQueue = localLibraryTracks;
    else if (source === 'private') selectedQueue = privateTracks;
    else if (source === 'public') selectedQueue = publicTracks;

    setTracks(selectedQueue);
    
    try {
      console.log(`[App] Switching source to ${source}...`);
      await TrackPlayer.clear();
      await TrackPlayer.setMediaItems(selectedQueue);
      await TrackPlayer.skipToIndex(0);
      
      if (isPlaying) {
        await TrackPlayer.play();
      }
      console.log(`[App] Source switched to ${source} successfully.`);
    } catch (e) {
      console.error('[App] Error switching tracks source:', e);
    } finally {
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

      const newTracks = media.assets
        .filter(asset => asset.filename && asset.filename.toLowerCase().endsWith('.mp3'))
        .map((asset, idx) => ({
          mediaId: asset.id || `local-scanned-${idx}-${Date.now()}`,
          url: asset.uri,
          title: asset.filename.replace(/\.mp3$/i, ''),
          artist: 'Audio Escaneado',
          artworkUrl: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400&q=80', // default artwork
        }));

      if (newTracks.length === 0) {
        Alert.alert('Escaneo Completado', 'No se encontraron archivos .mp3 en el dispositivo.');
        setIsSourceChanging(false);
        return;
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
      
      const importedTracks = res.assets.map((asset, idx) => ({
        mediaId: `imported-${Date.now()}-${idx}`,
        url: asset.uri,
        title: asset.name.replace(/\.mp3$/i, ''),
        artist: 'Archivo Importado',
        artworkUrl: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=400&q=80', // default artwork
      }));

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
