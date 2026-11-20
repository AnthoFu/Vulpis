import { useState, useCallback, useMemo, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Track } from '../models/Track';

export interface UseBatchSelectionReturn {
  isSelectionMode: boolean;
  selectedTracks: Track[];
  selectedTrackIds: Set<string>;
  selectedCount: number;
  isSelected: (mediaId: string) => boolean;
  toggleTrackSelection: (track: Track) => void;
  selectTrack: (track: Track) => void;
  deselectTrack: (mediaId: string) => void;
  selectAll: (tracks: Track[]) => void;
  clearSelection: () => void;
  enterSelectionMode: (initialTrack?: Track) => void;
  exitSelectionMode: () => void;
}

/**
 * Hook para gestionar la selección múltiple por lotes (Batch Multi-Selection)
 * de canciones en la biblioteca musical y listas de reproducción.
 */
export default function useBatchSelection(): UseBatchSelectionReturn {
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedMap, setSelectedMap] = useState<Map<string, Track>>(new Map());

  // Salir de modo selección al presionar el botón físico Atrás en Android
  useEffect(() => {
    if (!isSelectionMode) return;

    const onBackPress = () => {
      setIsSelectionMode(false);
      setSelectedMap(new Map());
      return true; // Consumir evento
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isSelectionMode]);

  const selectedTracks = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedTrackIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const selectedCount = selectedMap.size;

  const isSelected = useCallback(
    (mediaId: string): boolean => {
      return selectedMap.has(mediaId);
    },
    [selectedMap]
  );

  const toggleTrackSelection = useCallback((track: Track) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(track.mediaId)) {
        next.delete(track.mediaId);
      } else {
        next.set(track.mediaId, track);
      }
      return next;
    });
  }, []);

  const selectTrack = useCallback((track: Track) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.set(track.mediaId, track);
      return next;
    });
  }, []);

  const deselectTrack = useCallback((mediaId: string) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.delete(mediaId);
      return next;
    });
  }, []);

  const selectAll = useCallback((tracks: Track[]) => {
    setSelectedMap(() => {
      const next = new Map<string, Track>();
      for (const track of tracks) {
        next.set(track.mediaId, track);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMap(new Map());
  }, []);

  const enterSelectionMode = useCallback((initialTrack?: Track) => {
    setIsSelectionMode(true);
    if (initialTrack) {
      setSelectedMap(new Map([[initialTrack.mediaId, initialTrack]]));
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMap(new Map());
  }, []);

  return {
    isSelectionMode,
    selectedTracks,
    selectedTrackIds,
    selectedCount,
    isSelected,
    toggleTrackSelection,
    selectTrack,
    deselectTrack,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  };
}
