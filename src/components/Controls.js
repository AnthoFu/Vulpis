import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TrackPlayer, { useIsPlaying } from '@rntp/player';

export default function Controls() {
  const { playing } = useIsPlaying();
  const isPlaying = playing ?? false;

  const togglePlayback = async () => {
    try {
      console.log('Toggling playback. Current isPlaying:', isPlaying);
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('Error toggling playback:', e);
    }
  };

  const playNext = async () => {
    try {
      console.log('Skipping to next track');
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (e) {
      console.log('No next track or end of queue:', e);
    }
  };

  const playPrevious = async () => {
    try {
      console.log('Skipping to previous track');
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (e) {
      console.log('No previous track or start of queue:', e);
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
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
});
