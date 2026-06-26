import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import TrackPlayer, {
  PlayerCommand,
  useIsPlaying,
  useProgress,
  useActiveMediaItem,
} from '@rntp/player';

const trackQueue = [
  {
    id: '1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Midnight Horizon',
    artist: 'Lofi Dreamer',
    artwork: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
  },
  {
    id: '2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Neon Dreams',
    artist: 'Retro Synth',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
  },
  {
    id: '3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Vulpis Groove',
    artist: 'Funk Master',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  },
];

export default function App() {
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const isPlaying = useIsPlaying();
  const activeTrack = useActiveMediaItem();
  const { position, duration } = useProgress();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await TrackPlayer.setupPlayer({});
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
          ],
        });
        
        // setMediaItems reemplaza la cola completa, evitando duplicados en recargas
        await TrackPlayer.setMediaItems(trackQueue);

        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      } catch (err) {
        console.log('Player setup info:', err);
        // Si ya está inicializado, queremos marcarlo como listo
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

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const playNext = async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (e) {
      console.log('Fin de la cola');
    }
  };

  const playPrevious = async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (e) {
      console.log('Inicio de la cola');
    }
  };

  const selectTrack = async (trackId) => {
    try {
      await TrackPlayer.skip(trackId);
      await TrackPlayer.play();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  if (!isPlayerInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando Vulpis Player...</Text>
      </View>
    );
  }

  const currentTrackTitle = activeTrack?.title ?? trackQueue[0].title;
  const currentTrackArtist = activeTrack?.artist ?? trackQueue[0].artist;
  const currentTrackArtwork = activeTrack?.artwork ?? trackQueue[0].artwork;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>REPRODUCTOR NATIVO</Text>
        <Text style={styles.headerTitle}>VULPIS</Text>
      </View>

      {/* Tarjeta de Reproducción */}
      <View style={styles.playerCard}>
        <Image
          source={{ uri: currentTrackArtwork }}
          style={styles.artwork}
          resizeMode="cover"
        />
        
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrackTitle}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrackArtist}
          </Text>
        </View>

        {/* Barra de Progreso Personalizada */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarActive, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Panel de Controles */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
            <Text style={styles.controlIconText}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <Text style={styles.playIconText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} style={styles.controlButton}>
            <Text style={styles.controlIconText}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cola de Reproducción */}
      <View style={styles.queueContainer}>
        <Text style={styles.queueHeader}>SIGUIENTE EN COLA</Text>
        <FlatList
          data={trackQueue}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isCurrent = activeTrack ? activeTrack.title === item.title : index === 0;
            return (
              <TouchableOpacity
                onPress={() => selectTrack(item.id)}
                style={[
                  styles.queueItem,
                  isCurrent && styles.queueItemActive,
                ]}
              >
                <Image source={{ uri: item.artwork }} style={styles.queueArtwork} />
                <View style={styles.queueDetails}>
                  <Text
                    style={[
                      styles.queueTitle,
                      isCurrent && styles.queueTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingIndicatorText}>SONANDO</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
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
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  headerSubtitle: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 4,
  },
  playerCard: {
    backgroundColor: '#161722',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 24,
  },
  trackDetails: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  trackArtist: {
    color: '#8E8F9E',
    fontSize: 15,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 6,
    width: '100%',
    backgroundColor: '#2C2D3C',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#8E8F9E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%',
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#232433',
  },
  controlIconText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  playButton: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 34,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    marginLeft: 2,
  },
  queueContainer: {
    flex: 1,
    marginTop: 24,
  },
  queueHeader: {
    color: '#5F6070',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#12131A',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  queueItemActive: {
    backgroundColor: '#1C1D2A',
    borderColor: '#3B3D54',
  },
  queueArtwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 14,
  },
  queueDetails: {
    flex: 1,
  },
  queueTitle: {
    color: '#E2E3E9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  queueTextActive: {
    color: '#8B5CF6',
  },
  queueArtist: {
    color: '#8E8F9E',
    fontSize: 13,
  },
  playingIndicator: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  playingIndicatorText: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
