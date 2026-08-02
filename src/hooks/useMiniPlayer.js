import { useState } from 'react';
import { Image } from 'react-native';
import TrackPlayer from '@rntp/player';

export default function useMiniPlayer({
  activeTrack,
  isPlaying,
  position,
  duration,
  tracks = [],
  playQueue = [],
  onSelectTrack,
  isShuffleActive,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useMiniPlayer] Error al alternar la reproducción:', e);
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
          console.log(`[useMiniPlayer] Saltando respaldo a pista de biblioteca: ${targetTrack.title}`);
          await onSelectTrack(targetTrack, targetIndex);
        }
      } else {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      }
    } catch (fallbackErr) {
      console.error('[useMiniPlayer] Error en playLibraryFallback:', fallbackErr);
      try {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } catch (err) {
        console.error('[useMiniPlayer] Respaldo absoluto falló:', err);
      }
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[useMiniPlayer] Saltando a la pista anterior de la cola');
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else {
        console.log('[useMiniPlayer] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('prev');
      }
    } catch (e) {
      console.log('[useMiniPlayer] No hay pista anterior:', e);
      await playLibraryFallback('prev');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[useMiniPlayer] Saltando a la siguiente pista de la cola');
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else {
        console.log('[useMiniPlayer] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('next');
      }
    } catch (e) {
      console.log('[useMiniPlayer] No hay siguiente pista:', e);
      await playLibraryFallback('next');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const currentArtwork = activeTrack?.artworkUrl || defaultCover;

  return {
    isProcessing,
    togglePlayback,
    playPrevious,
    playNext,
    progressPercent,
    currentArtwork,
  };
}
