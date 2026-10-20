import { useState, useEffect, useMemo } from 'react';
import { fetchWebLyrics } from '../services/webLyrics';

export default function useWebLyrics(currentTrack, currentTime, onSeek) {
  const [lyricsData, setLyricsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
      if (lines[i].time !== null && currentTime >= lines[i].time) {
        index = i;
      } else if (lines[i].time !== null && currentTime < lines[i].time) {
        break;
      }
    }
    return index;
  }, [lyricsData, currentTime]);

  const handleLineClick = (time) => {
    if (time !== null && onSeek) {
      onSeek(time);
    }
  };

  const togglePanel = () => {
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
