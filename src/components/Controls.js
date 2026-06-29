import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer, { RepeatMode } from '@rntp/player';

export default function Controls({ isPlaying, repeatMode, isShuffleActive }) {
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

  const toggleShuffle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const nextShuffle = !isShuffleActive;
      console.log('Setting shuffle enabled:', nextShuffle);
      await TrackPlayer.setShuffleEnabled(nextShuffle);
    } catch (e) {
      console.error('Error toggling shuffle:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const cycleRepeatMode = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let nextMode;
      if (repeatMode === RepeatMode.Off || !repeatMode) {
        nextMode = RepeatMode.All;
      } else if (repeatMode === RepeatMode.All) {
        nextMode = RepeatMode.One;
      } else {
        nextMode = RepeatMode.Off;
      }
      console.log('Setting repeat mode:', nextMode);
      await TrackPlayer.setRepeatMode(nextMode);
    } catch (e) {
      console.error('Error setting repeat mode:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const isRepeatActive = repeatMode && repeatMode !== RepeatMode.Off;

  return (
    <View style={[styles.controlsRow, isProcessing && styles.controlsDisabled]}>
      {/* SHUFFLE BUTTON */}
      <TouchableOpacity
        onPress={toggleShuffle}
        style={[styles.secondaryButton, isShuffleActive && styles.activeSecondaryButton]}
        disabled={isProcessing}
      >
        <MaterialCommunityIcons
          name="shuffle"
          size={22}
          color={isShuffleActive ? '#8B5CF6' : '#5F6070'}
        />
      </TouchableOpacity>

      {/* PREVIOUS BUTTON */}
      <TouchableOpacity onPress={playPrevious} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-previous" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* PLAY / PAUSE BUTTON */}
      <TouchableOpacity onPress={togglePlayback} style={styles.playButton} disabled={isProcessing}>
        <MaterialCommunityIcons
          name={isPlaying ? 'pause' : 'play'}
          size={36}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 4 } : null}
        />
      </TouchableOpacity>

      {/* NEXT BUTTON */}
      <TouchableOpacity onPress={playNext} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-next" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* REPEAT BUTTON */}
      <TouchableOpacity
        onPress={cycleRepeatMode}
        style={[styles.secondaryButton, isRepeatActive && styles.activeSecondaryButton]}
        disabled={isProcessing}
      >
        <MaterialCommunityIcons
          name={repeatMode === RepeatMode.One ? 'repeat-once' : 'repeat'}
          size={22}
          color={isRepeatActive ? '#8B5CF6' : '#5F6070'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  controlsDisabled: {
    opacity: 0.7,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#232433',
  },
  secondaryButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeSecondaryButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
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
});
