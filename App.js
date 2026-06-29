import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { PlayerCommand, Event, RepeatMode } from '@rntp/player';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
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

  // Navigation Drawer & Source states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState('local'); // 'local' | 'private' | 'public'
  const [tracks, setTracks] = useState(localTracks);
  const [isSourceChanging, setIsSourceChanging] = useState(false);

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
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(localTracks);
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
        
        tick++;
        if (tick % 8 === 0) { // log only once every 2 seconds
          console.log('[DEBUG-POLL]', {
            activeTrack: currentActive,
            state: TrackPlayer.getPlaybackState(),
            isPlaying: currentPlaying,
            position: currentProgress?.position,
            repeatMode: currentRepeat,
            isShuffleActive: currentShuffle,
          });
        }

        setActiveTrack(currentActive);
        setIsPlaying(currentPlaying);
        setRepeatMode(currentRepeat);
        setIsShuffleActive(currentShuffle);
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
    if (source === 'local') selectedQueue = localTracks;
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
      
      <QueueList
        activeTrack={activeTrack}
        tracks={tracks}
        isLoading={isSourceChanging}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }}
        ListHeaderComponent={
          <>
            <Header onMenuPress={() => setIsDrawerOpen(true)} />
            <PlayerCard
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              position={progress.position}
              duration={progress.duration}
              repeatMode={repeatMode}
              isShuffleActive={isShuffleActive}
              tracks={tracks}
            />
          </>
        }
      />

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
