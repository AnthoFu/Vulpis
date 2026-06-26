import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TrackPlayer from '@rntp/player';

export default function Controls({ isPlaying }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      console.log('Toggling playback. Current isPlaying:', isPlaying);
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('Error toggling playback:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      console.log('Skipping to next track');
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (e) {
      console.log('No next track or end of queue:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      console.log('Skipping to previous track');
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (e) {
      console.log('No previous track or start of queue:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.controlsRow, isProcessing && styles.controlsDisabled]}>
      <TouchableOpacity onPress={playPrevious} style={styles.controlButton} disabled={isProcessing}>
        <Text style={styles.controlIconText}>⏮</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={togglePlayback} style={styles.playButton} disabled={isProcessing}>
        <Text style={styles.playIconText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={playNext} style={styles.controlButton} disabled={isProcessing}>
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
  controlsDisabled: {
    opacity: 0.5,
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
