import AsyncStorage from '@react-native-async-storage/async-storage';
import { isExcludedAudio } from '../utils/audioFilter';

export const PLAYER_STATE_KEY = 'vulpis_player_state';
export const LOCAL_TRACKS_KEY = 'vulpis_local_tracks';

/**
 * Sanitiza la cola para evitar que cadenas base64 gigantes excedan el límite de SQLite CursorWindow (2MB) en Android.
 */
export const sanitizeQueueForStorage = (queue) => {
  if (!queue || !Array.isArray(queue)) return [];
  return queue.map((t) => ({
    mediaId: t.mediaId,
    url: t.url,
    title: t.title,
    artist: t.artist,
    album: t.album || '',
    genre: t.genre || '',
    duration: t.duration || 0,
    artworkUrl: t.artworkUrl && t.artworkUrl.startsWith('data:') ? null : t.artworkUrl,
    gain: t.gain,
    peak: t.peak,
  }));
};

/**
 * Hook utilitario para la persistencia y recuperación segura del estado del reproductor y biblioteca local.
 */
export default function usePlayerPersistence() {
  /**
   * Guarda de forma asíncrona el estado del reproductor en AsyncStorage.
   */
  const savePlayerState = async ({ currentSource, playQueue, activeTrackId, progressPosition }) => {
    try {
      const stateToSave = {
        currentSource,
        playQueue: sanitizeQueueForStorage(playQueue),
        activeTrackId,
        progressPosition,
      };
      await AsyncStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('[usePlayerPersistence] Error al guardar el estado del reproductor:', err);
    }
  };

  /**
   * Carga el estado previamente guardado del reproductor.
   */
  const loadPlayerState = async () => {
    try {
      const storedState = await AsyncStorage.getItem(PLAYER_STATE_KEY);
      if (!storedState) return null;
      return JSON.parse(storedState);
    } catch (stateErr) {
      console.error('[usePlayerPersistence] Error al leer el estado guardado del reproductor:', stateErr);
      await AsyncStorage.removeItem(PLAYER_STATE_KEY).catch(() => {});
      return null;
    }
  };

  /**
   * Carga las pistas locales almacenadas aplicando el filtro inteligente de audio.
   */
  const loadStoredLocalTracks = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_TRACKS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter((t) => !isExcludedAudio(t));
        if (cleaned.length !== parsed.length) {
          AsyncStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(cleaned)).catch(() => {});
        }
        return cleaned;
      }
    } catch (storageErr) {
      console.error('[usePlayerPersistence] Error al leer las pistas locales almacenadas:', storageErr);
    }
    return [];
  };

  return {
    savePlayerState,
    loadPlayerState,
    loadStoredLocalTracks,
    sanitizeQueueForStorage,
  };
}
