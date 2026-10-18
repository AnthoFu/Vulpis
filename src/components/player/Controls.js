import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import styles from '../../styles/Controls.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RepeatMode } from '@rntp/player';
import useControls from '../../hooks/useControls';

/**
 * Controles de reproducción principales: Anterior, Play/Pausa, Siguiente, Aleatorio y Repetición.
 */
export default function Controls({
  isPlaying,
  repeatMode,
  isShuffleActive,
  tracks = [],
  playQueue = [],
  activeTrack,
  onSelectTrack,
  crossfadeSettings,
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
    crossfadeSettings,
  });

  return (
    <View style={[styles.controlsRow, isProcessing && styles.controlsDisabled]}>
      {/* Botón de reproducción aleatoria */}
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

      {/* Botón anterior */}
      <TouchableOpacity onPress={playPrevious} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-previous" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Botón reproducir / pausar */}
      <TouchableOpacity onPress={togglePlayback} style={styles.playButton} disabled={isProcessing}>
        <MaterialCommunityIcons
          name={isPlaying ? 'pause' : 'play'}
          size={36}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 4 } : null}
        />
      </TouchableOpacity>

      {/* Botón siguiente */}
      <TouchableOpacity onPress={playNext} style={styles.controlButton} disabled={isProcessing}>
        <MaterialCommunityIcons name="skip-next" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Botón de repetición */}
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
