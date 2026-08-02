import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import styles from '../styles/Controls.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RepeatMode } from '@rntp/player';
import useControls from '../hooks/useControls';

export default function Controls({
  isPlaying,
  repeatMode,
  isShuffleActive,
  tracks = [],
  playQueue = [],
  activeTrack,
  onSelectTrack,
}) {
  const {
    isProcessing,
    togglePlayback,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
    isRepeatActive,
  } = useControls({
    isPlaying,
    repeatMode,
    isShuffleActive,
    tracks,
    playQueue,
    activeTrack,
    onSelectTrack,
  });

  return (
    <View style={[styles.controlsRow, isProcessing && styles.controlsDisabled]}>
      {/* BOTÓN DE REPRODUCCIÓN ALEATORIA */}
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

      {/* BOTÓN ANTERIOR */}
      <TouchableOpacity onPress={playPrevious} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-previous" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* BOTÓN REPRODUCIR / PAUSAR */}
      <TouchableOpacity onPress={togglePlayback} style={styles.playButton} disabled={isProcessing}>
        <MaterialCommunityIcons
          name={isPlaying ? 'pause' : 'play'}
          size={36}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 4 } : null}
        />
      </TouchableOpacity>

      {/* BOTÓN SIGUIENTE */}
      <TouchableOpacity onPress={playNext} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-next" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* BOTÓN DE REPETICIÓN */}
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
