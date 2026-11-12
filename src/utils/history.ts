import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../models/Track';
import {
  PlaybackHistoryItem,
  MAX_HISTORY_ITEMS,
  HISTORY_STORAGE_KEY,
} from '../models/History';

/**
 * Sanitiza la pista antes de persistirla en el historial para evitar desbordes
 * de CursorWindow en SQLite de Android.
 */
function sanitizeTrackForHistory(track: Track): Track {
  let artworkUrl = track.artworkUrl;
  if (artworkUrl && typeof artworkUrl === 'string' && artworkUrl.startsWith('data:image')) {
    artworkUrl = undefined;
  }

  return {
    mediaId: track.mediaId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    artworkUrl,
    url: track.url,
  };
}

/**
 * Recupera el historial de reproducción almacenado de forma segura.
 */
export async function getStoredPlaybackHistory(): Promise<PlaybackHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) => item && item.track && typeof item.track.mediaId === 'string'
    );
  } catch (error) {
    console.warn('[History] Error al cargar historial desde AsyncStorage:', error);
    return [];
  }
}

/**
 * Guarda el historial de reproducción en AsyncStorage con límite rotativo.
 */
export async function savePlaybackHistory(
  history: PlaybackHistoryItem[]
): Promise<void> {
  try {
    const clamped = history.slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(clamped));
  } catch (error) {
    console.error('[History] Error al persistir historial:', error);
  }
}

/**
 * Agrega o actualiza una pista en el historial de reproducción.
 * Si la pista ya figuraba en el historial, la mueve a la cima con el timestamp actual.
 */
export async function addTrackToPlaybackHistory(
  track: Track,
  playbackDuration?: number
): Promise<PlaybackHistoryItem[]> {
  if (!track || !track.mediaId) return [];

  try {
    const currentHistory = await getStoredPlaybackHistory();
    const sanitizedTrack = sanitizeTrackForHistory(track);

    // Filtrar ocurrencia anterior de la misma pista para evitar duplicados consecutivos
    const filtered = currentHistory.filter(
      (item) => item.track.mediaId !== track.mediaId
    );

    const newItem: PlaybackHistoryItem = {
      id: `${track.mediaId}_${Date.now()}`,
      track: sanitizedTrack,
      playedAt: Date.now(),
      playbackDuration,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    await savePlaybackHistory(updated);
    return updated;
  } catch (error) {
    console.error('[History] Error al registrar pista en historial:', error);
    return [];
  }
}

/**
 * Elimina una entrada específica del historial por su identificador.
 */
export async function removeTrackFromPlaybackHistory(
  historyItemId: string
): Promise<PlaybackHistoryItem[]> {
  try {
    const currentHistory = await getStoredPlaybackHistory();
    const updated = currentHistory.filter((item) => item.id !== historyItemId && item.track.mediaId !== historyItemId);
    await savePlaybackHistory(updated);
    return updated;
  } catch (error) {
    console.error('[History] Error al eliminar elemento del historial:', error);
    return [];
  }
}

/**
 * Vacía completamente el historial de reproducción.
 */
export async function clearPlaybackHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('[History] Error al vaciar historial:', error);
  }
}

/**
 * Formatea un timestamp milimétrico en una cadena de tiempo relativo en español.
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) {
    return 'Hace un momento';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Ayer a las ${hours}:${minutes}`;
  }

  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  const date = new Date(timestamp);
  const day = date.getDate();
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}
