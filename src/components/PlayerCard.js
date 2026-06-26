import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useActiveMediaItem } from '@rntp/player';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import { trackQueue } from '../constants/tracks';

export default function PlayerCard() {
  const activeTrack = useActiveMediaItem();

  const currentTrackTitle = activeTrack?.title ?? trackQueue[0].title;
  const currentTrackArtist = activeTrack?.artist ?? trackQueue[0].artist;
  const currentTrackArtwork = activeTrack?.artworkUrl ?? trackQueue[0].artworkUrl;

  return (
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

      <ProgressBar />
      <Controls />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
