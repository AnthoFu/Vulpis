import { useState } from 'react';
import TrackPlayer from '@rntp/player';

export interface UseProgressBarParams {
  position: number;
  duration: number;
}

export interface UseProgressBarReturn {
  displayPosition: number;
  formatTime: (seconds: number) => string;
  handleValueChange: (val: number) => void;
  handleSlidingComplete: (val: number) => Promise<void>;
}

export default function useProgressBar({ position, duration }: UseProgressBarParams): UseProgressBarReturn {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleValueChange = (val: number): void => {
    setSeekPosition(val);
    if (!isSeeking) {
      setIsSeeking(true);
    }
  };

  const handleSlidingComplete = async (val: number): Promise<void> => {
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
