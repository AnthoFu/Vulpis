import { useState, useEffect, useRef } from 'react';
import { Image, Animated } from 'react-native';
import TrackPlayer from '@rntp/player';
import ImageColors from 'react-native-image-colors';
import { extractMetadata, formatLyricsText } from '../utils/metadata';

export default function usePlayerCard({
  activeTrack,
  tracks,
  initialQueueVisible,
}) {
  const [isQueueVisible, setIsQueueVisible] = useState(initialQueueVisible);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [lyricsText, setLyricsText] = useState(null);
  const [rawLyrics, setRawLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const [colorA, setColorA] = useState('#161722');
  const [colorB, setColorB] = useState('#161722');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsQueueVisible(initialQueueVisible);
  }, [initialQueueVisible]);

  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const defaultTrack = tracks && tracks.length > 0 ? tracks[0] : { title: 'No Track', artist: 'No Artist', artworkUrl: defaultCover };
  
  const currentTrackTitle = activeTrack?.title ?? defaultTrack.title;
  const currentTrackArtist = activeTrack?.artist ?? defaultTrack.artist;
  const currentTrackArtwork = activeTrack?.artworkUrl ?? defaultTrack.artworkUrl;

  // Cargar/extraer letras automáticamente cuando cambia la pista activa
  useEffect(() => {
    let isMounted = true;

    async function loadLyrics() {
      if (!activeTrack) {
        if (isMounted) {
          setLyricsText(null);
          setRawLyrics(null);
        }
        return;
      }

      // Si la pista ya contiene letras
      if (activeTrack.lyrics) {
        if (isMounted) {
          setRawLyrics(activeTrack.lyrics);
          setLyricsText(formatLyricsText(activeTrack.lyrics));
          setIsLoadingLyrics(false);
        }
        return;
      }

      // Si no tiene letras guardadas pero es un archivo local, intentar extraer metadatos
      if (activeTrack.url && (activeTrack.url.startsWith('file://') || activeTrack.url.startsWith('/'))) {
        try {
          if (isMounted) setIsLoadingLyrics(true);
          const meta = await extractMetadata(activeTrack.url);
          if (isMounted) {
            if (meta && meta.lyrics) {
              activeTrack.lyrics = meta.lyrics;
              setRawLyrics(meta.lyrics);
              setLyricsText(formatLyricsText(meta.lyrics));
            } else {
              setRawLyrics(null);
              setLyricsText(null);
            }
          }
        } catch (err) {
          console.error('[usePlayerCard] Error al extraer letra de la pista activa:', err);
          if (isMounted) {
            setRawLyrics(null);
            setLyricsText(null);
          }
        } finally {
          if (isMounted) setIsLoadingLyrics(false);
        }
      } else {
        if (isMounted) {
          setRawLyrics(null);
          setLyricsText(null);
          setIsLoadingLyrics(false);
        }
      }
    }

    loadLyrics();

    return () => {
      isMounted = false;
    };
  }, [activeTrack?.mediaId, activeTrack?.url]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchColors = async () => {
      if (!currentTrackArtwork) return;
      try {
        const result = await ImageColors.getColors(currentTrackArtwork, {
          fallback: '#161722',
          cache: true,
          key: currentTrackArtwork,
        });

        let newColor = '#161722';
        if (result.type === 'android') {
          newColor = result.dominant || result.vibrant || result.darkVibrant || '#161722';
        } else if (result.type === 'ios') {
          newColor = result.primary || result.background || '#161722';
        } else if (result.type === 'web') {
          newColor = result.dominant || '#161722';
        }

        if (isMounted) {
          setColorB(newColor);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            if (isMounted) {
              setColorA(newColor);
              fadeAnim.setValue(0);
            }
          });
        }
      } catch (e) {
        console.error('[usePlayerCard] Error al obtener colores de la imagen:', e);
      }
    };

    fetchColors();

    return () => {
      isMounted = false;
    };
  }, [currentTrackArtwork]);

  const selectTrackFromQueue = async (index) => {
    try {
      console.log(`[usePlayerCard Queue] Saltando al índice: ${index}`);
      await TrackPlayer.skipToIndex(index);
      await TrackPlayer.play();
    } catch (e) {
      console.error('[usePlayerCard Queue] Error al saltar al índice:', e);
    }
  };

  const togglePlayback = async (isPlayingState) => {
    try {
      if (isPlayingState) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[usePlayerCard] Error al alternar reproducción:', e);
    }
  };

  return {
    isQueueVisible,
    setIsQueueVisible,
    isLyricsVisible,
    setIsLyricsVisible,
    lyricsText,
    rawLyrics,
    isLoadingLyrics,
    colorA,
    colorB,
    fadeAnim,
    defaultCover,
    defaultTrack,
    currentTrackTitle,
    currentTrackArtist,
    currentTrackArtwork,
    selectTrackFromQueue,
    togglePlayback,
  };
}

