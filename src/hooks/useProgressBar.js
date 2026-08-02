import { useState } from 'react';
import TrackPlayer from '@rntp/player';

export default function useProgressBar({ position, duration }) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleValueChange = (val) => {
    setSeekPosition(val);
    if (!isSeeking) {
      setIsSeeking(true);
    }
  };

  const handleSlidingComplete = async (val) => {
    try {
      await TrackPlayer.seekTo(val);
    } catch (e) {
      console.error('[useProgressBar] Error al buscar posición en TrackPlayer:', e);
    } finally {
      setIsSeeking(false);
    }
  };

  const displayPosition = isSeeking ? seekPosition : position;

  return {
    displayPosition,
    formatTime,
    handleValueChange,
    handleSlidingComplete,
  };
}
