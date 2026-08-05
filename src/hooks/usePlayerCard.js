import { useState, useEffect, useRef } from 'react';
import { Image, Animated } from 'react-native';
import TrackPlayer from '@rntp/player';
import ImageColors from 'react-native-image-colors';
import { extractMetadata, formatLyricsText } from '../utils/metadata';
import {
  getSettings,
  fetchOnlineLyrics,
  getCustomLyrics,
  saveCustomLyrics,
  removeCustomLyrics,
} from '../utils/onlineLyrics';

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
          setIsLoadingLyrics(false);
        }
        return;
      }

      if (isMounted) setIsLoadingLyrics(true);

      const trackKey = activeTrack.mediaId || activeTrack.url;

      // 1. Verificar si el usuario ha guardado una letra personalizada para esta canción
      try {
        const custom = await getCustomLyrics(trackKey);
        if (custom) {
          if (isMounted) {
            activeTrack.customLyrics = custom;
            setRawLyrics(custom);
            setLyricsText(formatLyricsText(custom));
            setIsLoadingLyrics(false);
          }
          return;
        }
      } catch (err) {
        console.error('[usePlayerCard] Error leyendo letra personalizada:', err);
      }

      let foundLyrics = null;
      const settings = await getSettings().catch(() => DEFAULT_SETTINGS);

      // 2. Si la búsqueda en línea está activada Y se prefiere reemplazar metadatos por la API (preferOnlineOverID3)
      if (settings.onlineLyricsEnabled && settings.preferOnlineOverID3) {
        try {
          console.log('[usePlayerCard] Búsqueda en línea activada (Prioridad API). Consultando API para:', activeTrack.title);
          const online = await fetchOnlineLyrics(
            activeTrack.title,
            activeTrack.artist,
            activeTrack.duration,
            settings.matchThreshold
          );
          if (online) {
            foundLyrics = online;
          }
        } catch (err) {
          console.error('[usePlayerCard] Error en búsqueda de letras en línea:', err);
        }
      }

      // 3. Si la pista ya contiene letras en su objeto de pista y no se obtuvieron de la API
      if (!foundLyrics && activeTrack.lyrics) {
        foundLyrics = activeTrack.lyrics;
      }

      // 4. Si no tiene letras guardadas pero es un archivo local, intentar extraer metadatos ID3 o sidecar
      if (!foundLyrics && activeTrack.url && (activeTrack.url.startsWith('file://') || activeTrack.url.startsWith('/'))) {
        try {
          const meta = await extractMetadata(activeTrack.url);
          if (meta && meta.lyrics) {
            foundLyrics = meta.lyrics;
          }
        } catch (err) {
          console.error('[usePlayerCard] Error al extraer letra de la pista activa:', err);
        }
      }

      // 5. Si aún no hay letras, verificar si la búsqueda de letras en línea está activada (y no se ejecutó en el paso 2)
      if (!foundLyrics && settings.onlineLyricsEnabled && !settings.preferOnlineOverID3) {
        try {
          const online = await fetchOnlineLyrics(
            activeTrack.title,
            activeTrack.artist,
            activeTrack.duration,
            settings.matchThreshold
          );
          if (online) {
            foundLyrics = online;
          }
        } catch (err) {
          console.error('[usePlayerCard] Error en búsqueda de letras en línea:', err);
        }
      }

      if (isMounted) {
        if (foundLyrics) {
          activeTrack.lyrics = foundLyrics;
          setRawLyrics(foundLyrics);
          setLyricsText(formatLyricsText(foundLyrics));
        } else {
          setRawLyrics(null);
          setLyricsText(null);
        }
        setIsLoadingLyrics(false);
      }
    }

    loadLyrics();

    return () => {
      isMounted = false;
    };
  }, [activeTrack?.mediaId, activeTrack?.url]);

  const handleFetchOnlineLyricsForce = async () => {
    if (!activeTrack) return false;
    setIsLoadingLyrics(true);
    try {
      const settings = await getSettings().catch(() => DEFAULT_SETTINGS);
      console.log('[usePlayerCard] Forzando búsqueda remota en la API para:', activeTrack.title);
      const online = await fetchOnlineLyrics(
        activeTrack.title,
        activeTrack.artist,
        activeTrack.duration,
        settings.matchThreshold,
        true // Ignorar caché previo
      );

      if (online) {
        const trackKey = activeTrack.mediaId || activeTrack.url;
        await saveCustomLyrics(trackKey, online);
        activeTrack.lyrics = online;
        setRawLyrics(online);
        setLyricsText(formatLyricsText(online));
        setIsLoadingLyrics(false);
        return true;
      }
    } catch (e) {
      console.error('[usePlayerCard] Error al forzar búsqueda remota:', e);
    }
    setIsLoadingLyrics(false);
    return false;
  };

  const handleSaveCustomLyrics = async (newLyrics) => {
    if (!activeTrack) return;
    const trackKey = activeTrack.mediaId || activeTrack.url;
    await saveCustomLyrics(trackKey, newLyrics);
    activeTrack.customLyrics = newLyrics;
    setRawLyrics(newLyrics);
    setLyricsText(formatLyricsText(newLyrics));
  };

  const handleResetCustomLyrics = async () => {
    if (!activeTrack) return;
    const trackKey = activeTrack.mediaId || activeTrack.url;
    await removeCustomLyrics(trackKey);
    delete activeTrack.customLyrics;
    delete activeTrack.lyrics;
    setRawLyrics(null);
    setLyricsText(null);
    setIsLoadingLyrics(true);

    let original = null;
    if (activeTrack.url && (activeTrack.url.startsWith('file://') || activeTrack.url.startsWith('/'))) {
      const meta = await extractMetadata(activeTrack.url).catch(() => null);
      original = meta?.lyrics || null;
    }

    if (!original) {
      const settings = await getSettings();
      if (settings.onlineLyricsEnabled) {
        original = await fetchOnlineLyrics(activeTrack.title, activeTrack.artist, activeTrack.duration, settings.matchThreshold);
      }
    }

    if (original) {
      activeTrack.lyrics = original;
      setRawLyrics(original);
      setLyricsText(formatLyricsText(original));
    }
    setIsLoadingLyrics(false);
  };

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
    handleSaveCustomLyrics,
    handleResetCustomLyrics,
    handleFetchOnlineLyricsForce,
  };
}

