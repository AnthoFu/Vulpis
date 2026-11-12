import { Track } from './Track';

/**
 * Representa un elemento en el historial de reproducción de Vulpis.
 */
export interface PlaybackHistoryItem {
  id: string; // Identificador único del evento o mediaId
  track: Track;
  playedAt: number; // Timestamp en milisegundos de cuándo se escuchó
  playbackDuration?: number; // Segundos efectivos que se reprodujeron
}

/**
 * Cantidad máxima de canciones conservadas en el historial rotativo (FIFO).
 */
export const MAX_HISTORY_ITEMS = 100;

/**
 * Tiempo mínimo de reproducción en segundos para considerar una pista como "escuchada"
 * (estándar de scrobbling acústico para evitar registrar skips rápidos).
 */
export const MIN_PLAY_TIME_FOR_HISTORY_SEC = 10;

/**
 * Clave de persistencia en AsyncStorage (CursorWindow-safe).
 */
export const HISTORY_STORAGE_KEY = 'vulpis_playback_history';
