import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  Text,
  StatusBar,
} from 'react-native';
import TrackPlayer, { PlayerCommand, Event } from '@rntp/player';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
import QueueList from './src/components/QueueList';
import { trackQueue } from './src/constants/tracks';

export default function App() {
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });

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
        // Limpiamos la cola para evitar duplicados en recargas (Fast Refresh)
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(trackQueue);
        // Hacemos skip al primer elemento para que getActiveMediaItem() no retorne undefined
        await TrackPlayer.skipToIndex(0);

        console.log('[App] TrackPlayer setup completed successfully!');
        
        // Registrar listeners de depuración (pueden no dispararse en Android debido al bug)
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
        
        tick++;
        if (tick % 4 === 0) { // log only once every second
          console.log('[DEBUG-POLL]', {
            activeTrack: currentActive,
            state: TrackPlayer.getPlaybackState(),
            isPlaying: currentPlaying,
            position: currentProgress?.position
          });
        }

        setActiveTrack(currentActive);
        setIsPlaying(currentPlaying);
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

  if (!isPlayerInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando Vulpis Player...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      <Header />
      <PlayerCard
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        position={progress.position}
        duration={progress.duration}
      />
      <QueueList activeTrack={activeTrack} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
    paddingHorizontal: 20,
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
