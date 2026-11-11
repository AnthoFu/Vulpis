import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Track } from '../models/Track';
import {
  PlaybackHistoryItem,
  MIN_PLAY_TIME_FOR_HISTORY_SEC,
} from '../models/History';
import {
  getStoredPlaybackHistory,
  addTrackToPlaybackHistory,
  removeTrackFromPlaybackHistory,
  clearPlaybackHistory,
} from '../utils/history';

export interface UsePlaybackHistoryParams {
  activeTrack: Track | null;
  isPlaying: boolean;
  position: number;
  showToast?: (message: string) => void;
}

export interface UsePlaybackHistoryReturn {
  historyItems: PlaybackHistoryItem[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: Dispatch<SetStateAction<boolean>>;
  recordPlayback: (track: Track, duration?: number) => Promise<void>;
  handleRemoveHistoryItem: (id: string) => Promise<void>;
  handleClearHistory: () => Promise<void>;
  reloadHistory: () => Promise<void>;
}

/**
 * Hook para la gestión del historial de reproducción en Vulpis.
 * Registra automáticamente canciones escuchadas por al menos 10 segundos
 * y provee operaciones CRUD para la vista de historial.
 */
export default function usePlaybackHistory({
  activeTrack,
  isPlaying,
  position,
  showToast,
}: UsePlaybackHistoryParams): UsePlaybackHistoryReturn {
  const [historyItems, setHistoryItems] = useState<PlaybackHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Referencia para evitar registrar múltiples veces la misma pista durante una misma escucha
  const lastRecordedMediaIdRef = useRef<string | null>(null);
  const activeMediaId = activeTrack?.mediaId ?? null;

  // Carga inicial del historial desde almacenamiento
  const reloadHistory = async (): Promise<void> => {
    const loaded = await getStoredPlaybackHistory();
    setHistoryItems(loaded);
  };

  useEffect(() => {
    reloadHistory();
  }, []);

  // Si cambia la pista activa, resetear la referencia si es distinta
  useEffect(() => {
    if (activeMediaId !== lastRecordedMediaIdRef.current) {
      // Nueva pista, lista para ser registrada cuando supere el umbral
    }
  }, [activeMediaId]);

  // Si se reinicia la pista (repeat o rebobinado al inicio), permitir registrarla de nuevo
  useEffect(() => {
    if (position < 2 && lastRecordedMediaIdRef.current === activeMediaId) {
      lastRecordedMediaIdRef.current = null;
    }
  }, [position, activeMediaId]);

  // Registro automático cuando la reproducción supera el umbral de scrobbling (10 segundos)
  useEffect(() => {
    if (!activeTrack || !isPlaying) return;

    if (
      position >= MIN_PLAY_TIME_FOR_HISTORY_SEC &&
      lastRecordedMediaIdRef.current !== activeTrack.mediaId
    ) {
      lastRecordedMediaIdRef.current = activeTrack.mediaId;
      addTrackToPlaybackHistory(activeTrack, position).then((updated) => {
        setHistoryItems(updated);
      });
    }
  }, [position, isPlaying, activeTrack]);

  const recordPlayback = async (track: Track, duration?: number): Promise<void> => {
    if (!track) return;
    const updated = await addTrackToPlaybackHistory(track, duration);
    setHistoryItems(updated);
  };

  const handleRemoveHistoryItem = async (id: string): Promise<void> => {
    const updated = await removeTrackFromPlaybackHistory(id);
    setHistoryItems(updated);
    if (showToast) {
      showToast('Elemento eliminado del historial');
    }
  };

  const handleClearHistory = async (): Promise<void> => {
    await clearPlaybackHistory();
    setHistoryItems([]);
    if (showToast) {
      showToast('Historial vaciado');
    }
  };

  return {
    historyItems,
    isHistoryOpen,
    setIsHistoryOpen,
    recordPlayback,
    handleRemoveHistoryItem,
    handleClearHistory,
    reloadHistory,
  };
}
