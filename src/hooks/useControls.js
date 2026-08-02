import { useState } from 'react';
import TrackPlayer, { RepeatMode } from '@rntp/player';

export default function useControls({
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
      console.log('[useControls] Alternando reproducción. isPlaying actual:', isPlaying);
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useControls] Error al alternar la reproducción:', e);
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
          console.log(`[useControls] Saltando respaldo a pista de biblioteca: ${targetTrack.title}`);
          await onSelectTrack(targetTrack, targetIndex);
        }
      } else {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      }
    } catch (fallbackErr) {
      console.error('[useControls] Error en playLibraryFallback:', fallbackErr);
      try {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } catch (err) {
        console.error('[useControls] Respaldo absoluto falló:', err);
      }
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[useControls] Saltando a la siguiente pista de la cola');
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else {
        console.log('[useControls] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('next');
      }
    } catch (e) {
      console.log('[useControls] No hay siguiente pista o fin de la cola:', e);
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
        console.log('[useControls] Saltando a la pista anterior de la cola');
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else {
        console.log('[useControls] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('prev');
      }
    } catch (e) {
      console.log('[useControls] No hay pista anterior o inicio de la cola:', e);
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
      console.log('[useControls] Estableciendo reproducción aleatoria activada:', nextShuffle);
      await TrackPlayer.setShuffleEnabled(nextShuffle);
    } catch (e) {
      console.error('[useControls] Error al alternar la reproducción aleatoria:', e);
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
      console.log('[useControls] Estableciendo modo de repetición:', nextMode);
      await TrackPlayer.setRepeatMode(nextMode);
    } catch (e) {
      console.error('[useControls] Error al establecer modo de repetición:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const isRepeatActive = repeatMode && repeatMode !== RepeatMode.Off;

  return {
    isProcessing,
    togglePlayback,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
    isRepeatActive,
  };
}
