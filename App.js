import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  Text,
  StatusBar,
} from 'react-native';
import TrackPlayer, { PlayerCommand } from '@rntp/player';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
import QueueList from './src/components/QueueList';
import { trackQueue } from './src/constants/tracks';

export default function App() {
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        console.log('[App] Initializing TrackPlayer...');
        await TrackPlayer.setupPlayer({});
        
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
        await TrackPlayer.setMediaItems(trackQueue);

        console.log('[App] TrackPlayer setup completed successfully!');
        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      } catch (err) {
        console.error('[App] Player setup error:', err);
        // Marcamos como inicializado de todos modos para mostrar la UI
        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

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
      <PlayerCard />
      <QueueList />
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
