import { useState, useEffect, useMemo } from 'react';
import { fetchWebLyrics } from '../services/webLyrics';
import { WebTrack, WebLyricsData } from '../types';

export interface UseWebLyricsReturn {
  lyricsData: WebLyricsData | null;
  isLoading: boolean;
  isPanelOpen: boolean;
  activeLineIndex: number;
  togglePanel: () => void;
  handleLineClick: (time: number | null) => void;
}

export default function useWebLyrics(
  currentTrack: WebTrack | null,
  currentTime: number,
  onSeek?: (seconds: number) => void
): UseWebLyricsReturn {
  const [lyricsData, setLyricsData] = useState<WebLyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchWebLyrics(
      currentTrack.title,
      currentTrack.artist,
      currentTrack.album,
      currentTrack.duration || 0
    )
      .then((data) => {
        if (isMounted) {
          setLyricsData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLyricsData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  // Encontrar la línea activa en tiempo real según currentTime
  const activeLineIndex = useMemo(() => {
    if (!lyricsData || !lyricsData.parsed || lyricsData.parsed.length === 0) {
      return -1;
    }
    const lines = lyricsData.parsed;
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineTime = lines[i].time;
      if (lineTime !== null && currentTime >= lineTime) {
        index = i;
      } else if (lineTime !== null && currentTime < lineTime) {
        break;
      }
    }
    return index;
  }, [lyricsData, currentTime]);

  const handleLineClick = (time: number | null): void => {
    if (time !== null && onSeek) {
      onSeek(time);
    }
  };

  const togglePanel = (): void => {
    setIsPanelOpen((prev) => !prev);
  };

  return {
    lyricsData,
    isLoading,
    isPanelOpen,
    activeLineIndex,
    togglePanel,
    handleLineClick,
  };
}
