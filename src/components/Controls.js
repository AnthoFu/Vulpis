import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer, { RepeatMode } from '@rntp/player';

export default function Controls({
  isPlaying,
  repeatMode,
  isShuffleActive,
  tracks = [],
  playQueue = [],
  activeTrack,
  onSelectTrack,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      console.log('Alternando reproducción. isPlaying actual:', isPlaying);
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('Error al alternar la reproducción:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playLibraryFallback = async (direction) => {
    try {
      if (tracks && tracks.length > 0 && onSelectTrack) {
        let targetIndex = 0;
        if (isShuffleActive) {
          targetIndex = Math.floor(Math.random() * tracks.length);
        } else if (activeTrack) {
          const currentIdx = tracks.findIndex(t => t.mediaId === activeTrack.mediaId);
          if (currentIdx !== -1) {
            if (direction === 'next') {
              targetIndex = (currentIdx + 1) % tracks.length;
            } else {
              targetIndex = (currentIdx - 1 + tracks.length) % tracks.length;
            }
          }
        }
        const targetTrack = tracks[targetIndex];
        if (targetTrack) {
          console.log(`[Controls] Saltando respaldo a pista de biblioteca: ${targetTrack.title}`);
          await onSelectTrack(targetTrack, targetIndex);
        }
      } else {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      }
    } catch (fallbackErr) {
      console.error('Error en playLibraryFallback:', fallbackErr);
      try {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } catch (err) {
        console.error('Respaldo absoluto falló:', err);
      }
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('Saltando a la siguiente pista de la cola');
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else {
        console.log('La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('next');
      }
    } catch (e) {
      console.log('No hay siguiente pista o fin de la cola:', e);
      await playLibraryFallback('next');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('Saltando a la pista anterior de la cola');
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else {
        console.log('La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('prev');
      }
    } catch (e) {
      console.log('No hay pista anterior o inicio de la cola:', e);
      await playLibraryFallback('prev');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const toggleShuffle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      const nextShuffle = !isShuffleActive;
      console.log('Estableciendo reproducción aleatoria activada:', nextShuffle);
      await TrackPlayer.setShuffleEnabled(nextShuffle);
    } catch (e) {
      console.error('Error al alternar la reproducción aleatoria:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const cycleRepeatMode = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      let nextMode;
      if (repeatMode === RepeatMode.Off || !repeatMode) {
        nextMode = RepeatMode.All;
      } else if (repeatMode === RepeatMode.All) {
        nextMode = RepeatMode.One;
      } else {
        nextMode = RepeatMode.Off;
      }
      console.log('Estableciendo modo de repetición:', nextMode);
      await TrackPlayer.setRepeatMode(nextMode);
    } catch (e) {
      console.error('Error al establecer modo de repetición:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const isRepeatActive = repeatMode && repeatMode !== RepeatMode.Off;

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
