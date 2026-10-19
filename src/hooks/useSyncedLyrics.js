import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TrackPlayer from '@rntp/player';
import { parseLrcLyrics } from '../utils/metadata';

/**
 * Hook para la sincronización temporal, cálculo de líneas activas y auto-desplazamiento
 * de letras musicales sincrónicas (.lrc) y convencionales.
 */
export default function useSyncedLyrics({
  rawLyrics,
  lyricsText,
  position,
  activeTrackId,
  isVisible = false,
}) {
  const lyricsScrollRef = useRef(null);
  const lineLayoutsRef = useRef({});
  const containerHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const parsedLines = useMemo(() => parseLrcLyrics(rawLyrics), [rawLyrics]);
  const hasTimestamps = useMemo(() => parsedLines.some((l) => l.time !== null), [parsedLines]);

  const activeIndex = useMemo(() => {
    if (!hasTimestamps || parsedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      const item = parsedLines[i];
      if (item.time !== null && position >= item.time) {
        idx = i;
      }
    }
    return idx;
  }, [hasTimestamps, parsedLines, position]);

  const activeLyricLine = useMemo(() => {
    if (activeIndex >= 0 && activeIndex < parsedLines.length) {
      return parsedLines[activeIndex].text;
    }
    if (lyricsText) {
      return lyricsText.split('\n').find((line) => line.trim().length > 0) || null;
    }
    return null;
  }, [activeIndex, parsedLines, lyricsText]);

  const scrollToActiveLine = useCallback(
    (indexToScroll = activeIndex, animated = true) => {
      if (indexToScroll < 0 || !lyricsScrollRef.current) return;
      const layout = lineLayoutsRef.current[indexToScroll];
      if (!layout) {
        setTimeout(() => {
          const retryLayout = lineLayoutsRef.current[indexToScroll];
          if (retryLayout && lyricsScrollRef.current && !isUserScrollingRef.current) {
            const containerH = containerHeightRef.current || 400;
            const targetY = Math.max(0, retryLayout.y - containerH * 0.32 + retryLayout.height / 2);
            lyricsScrollRef.current?.scrollTo({ y: targetY, animated });
          }
        }, 100);
        return;
      }

      const containerH = containerHeightRef.current || 400;
      const targetY = Math.max(0, layout.y - containerH * 0.32 + layout.height / 2);
      lyricsScrollRef.current.scrollTo({ y: targetY, animated });
    },
    [activeIndex]
  );

  // Auto-scroll conforme avanza la reproducción de la pista
  useEffect(() => {
    if (isVisible && hasTimestamps && activeIndex >= 0 && !isUserScrollingRef.current) {
      scrollToActiveLine(activeIndex, true);
    }
  }, [activeIndex, isVisible, hasTimestamps, scrollToActiveLine]);

  // Centrar en la línea actual al abrir la hoja de letras
  useEffect(() => {
    if (isVisible && hasTimestamps && activeIndex >= 0) {
      const timer = setTimeout(() => {
        if (!isUserScrollingRef.current) {
          scrollToActiveLine(activeIndex, false);
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasTimestamps, activeIndex, scrollToActiveLine]);

  // Reiniciar estado de layouts al cambiar de canción
  useEffect(() => {
    lineLayoutsRef.current = {};
    isUserScrollingRef.current = false;
    setIsUserScrolled(false);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    lyricsScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTrackId, rawLyrics]);

  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    setIsUserScrolled(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      setIsUserScrolled(false);
      scrollToActiveLine(activeIndex, true);
    }, 4000);
  }, [activeIndex, scrollToActiveLine]);

  const handleManualSyncPress = useCallback(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    isUserScrollingRef.current = false;
    setIsUserScrolled(false);
    scrollToActiveLine(activeIndex, true);
  }, [activeIndex, scrollToActiveLine]);

  const handleLyricLinePress = useCallback(async (lineTime) => {
    if (lineTime === null || lineTime === undefined) return;
    try {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      isUserScrollingRef.current = false;
      setIsUserScrolled(false);
      await TrackPlayer.seekTo(lineTime);
    } catch (e) {
      console.error('[useSyncedLyrics] Error al buscar tiempo de letra:', e);
    }
  }, []);

  return {
    parsedLines,
    hasTimestamps,
    activeIndex,
    activeLyricLine,
    isUserScrolled,
    lyricsScrollRef,
    lineLayoutsRef,
    containerHeightRef,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleManualSyncPress,
    handleLyricLinePress,
    scrollToActiveLine,
  };
}
