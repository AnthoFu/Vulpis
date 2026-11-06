import AsyncStorage from '@react-native-async-storage/async-storage';
import { isExcludedAudio } from '../utils/audioFilter';
import { Track } from '../models/Track';

export const PLAYER_STATE_KEY = 'vulpis_player_state';
export const LOCAL_TRACKS_KEY = 'vulpis_local_tracks';

export interface SavedPlayerState {
  currentSource: string;
  playQueue: Partial<Track>[];
  activeTrackId?: string | null;
  progressPosition?: number;
  tracksList?: Track[];
}

export interface SavePlayerStateParams {
  currentSource: string;
  playQueue: Track[];
  activeTrackId?: string | null;
  progressPosition: number;
}

/**
 * Sanitiza la cola para evitar que cadenas base64 gigantes excedan el límite de SQLite CursorWindow (2MB) en Android.
 */
export const sanitizeQueueForStorage = (queue?: Track[] | null): Partial<Track>[] => {
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
    replayGain: t.replayGain,
  }));
};

export interface UsePlayerPersistenceReturn {
  savePlayerState: (params: SavePlayerStateParams) => Promise<void>;
  loadPlayerState: () => Promise<SavedPlayerState | null>;
  loadStoredLocalTracks: () => Promise<Track[]>;
  sanitizeQueueForStorage: (queue?: Track[] | null) => Partial<Track>[];
}

/**
 * Hook utilitario para la persistencia y recuperación segura del estado del reproductor y biblioteca local.
 */
export default function usePlayerPersistence(): UsePlayerPersistenceReturn {
  /**
   * Guarda de forma asíncrona el estado del reproductor en AsyncStorage.
   */
  const savePlayerState = async ({
    currentSource,
    playQueue,
    activeTrackId,
    progressPosition,
  }: SavePlayerStateParams): Promise<void> => {
    try {
      const stateToSave: SavedPlayerState = {
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
  const loadPlayerState = async (): Promise<SavedPlayerState | null> => {
    try {
      const storedState = await AsyncStorage.getItem(PLAYER_STATE_KEY);
      if (!storedState) return null;
      return JSON.parse(storedState) as SavedPlayerState;
    } catch (stateErr) {
      console.error('[usePlayerPersistence] Error al leer el estado guardado del reproductor:', stateErr);
      await AsyncStorage.removeItem(PLAYER_STATE_KEY).catch(() => {});
      return null;
    }
  };

  /**
   * Carga las pistas locales almacenadas aplicando el filtro inteligente de audio.
   */
  const loadStoredLocalTracks = async (): Promise<Track[]> => {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_TRACKS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as Track[];
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
