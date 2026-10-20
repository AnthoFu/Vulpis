import { useCallback } from 'react';
import { Alert } from 'react-native';
import TrackPlayer from '@rntp/player';

/**
 * Hook para la manipulación y gestión reactiva y nativa de la cola de reproducción.
 */
export default function useQueueController({
  playQueue,
  setPlayQueue,
  playQueueRef,
  activeTrack,
  progress,
  showToast,
  currentSourceRef,
  savePlayerState,
  isReorderingRef,
}) {
  /**
   * Agrega una pista inmediatamente después de la pista activa en la cola.
   */
  const handleAddToQueue = async (item) => {
    try {
      let activeIndex = TrackPlayer.getActiveMediaItemIndex();
      if (activeIndex === null || activeIndex === -1) {
        activeIndex = activeTrack ? playQueue.findIndex((t) => t.mediaId === activeTrack.mediaId) : 0;
        if (activeIndex === -1) activeIndex = 0;
      }

      const uniqueQueueId = `${item.mediaId}-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const queuedItem = {
        ...item,
        mediaId: uniqueQueueId,
        queueId: uniqueQueueId,
      };

      console.log(`[useQueueController] Agregando pista ${item.title} a la cola después del índice ${activeIndex}`);
      isReorderingRef.current = true;
      await TrackPlayer.insertMediaItem(activeIndex + 1, queuedItem);

      // Actualizar el estado de la cola de reproducción (playQueue)
      let updatedQueue = [];
      setPlayQueue((prev) => {
        const copy = [...prev];
        copy.splice(activeIndex + 1, 0, queuedItem);
        updatedQueue = copy;
        return copy;
      });

      if (savePlayerState) {
        savePlayerState({
          currentSource: currentSourceRef.current,
          playQueue: updatedQueue,
          activeTrackId: activeTrack?.mediaId ?? null,
          progressPosition: progress.position,
        });
      }

      setTimeout(() => {
        isReorderingRef.current = false;
      }, 500);

      showToast(`Añadido a la cola: ${item.title}`);
    } catch (e) {
      isReorderingRef.current = false;
      console.error('[useQueueController] Error al agregar pista a la cola:', e);
      Alert.alert('Error', 'No se pudo agregar la canción a la cola.');
    }
  };

  /**
   * Elimina una pista de la cola en el índice especificado.
   */
  const handleRemoveFromQueue = useCallback(
    async (item, index) => {
      try {
        console.log(`[useQueueController] 🗑️ Eliminando pista de la cola en índice ${index}: "${item.title}"`);
        isReorderingRef.current = true;
        await TrackPlayer.removeMediaItem(index);

        let updatedQueue = [];
        setPlayQueue((prev) => {
          const copy = [...prev];
          copy.splice(index, 1);
          updatedQueue = copy;
          return copy;
        });

        if (savePlayerState) {
          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: updatedQueue,
            activeTrackId: activeTrack?.mediaId ?? null,
            progressPosition: progress.position,
          });
        }

        setTimeout(() => {
          isReorderingRef.current = false;
        }, 500);

        showToast(`Eliminado de la cola: ${item.title}`);
      } catch (e) {
        isReorderingRef.current = false;
        console.error('[useQueueController] ❌ Error al eliminar pista de la cola:', e);
        Alert.alert('Error', 'No se pudo eliminar la canción de la cola.');
      }
    },
    [activeTrack?.mediaId, progress.position, showToast, currentSourceRef, savePlayerState, isReorderingRef, setPlayQueue]
  );

  /**
   * Mueve una pista de un índice a otro en la cola usando TrackPlayer.moveMediaItem nativo sin cortar la música.
   */
  const handleMoveQueueItem = useCallback(
    async (fromIndex, toIndex) => {
      try {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || toIndex < 0) return;
        const currentQ = playQueueRef.current || [];
        if (fromIndex >= currentQ.length || toIndex >= currentQ.length) {
          console.warn(
            `[useQueueController] ⚠️ Índices de movimiento fuera de rango: from=${fromIndex}, to=${toIndex}, total=${currentQ.length}`
          );
          return;
        }

        console.log(
          `[useQueueController] 🚀 [handleMoveQueueItem] Moviendo pista de índice ${fromIndex} a ${toIndex}: "${currentQ[fromIndex]?.title}"`
        );
        isReorderingRef.current = true;

        let updatedQueue = [];
        setPlayQueue((prev) => {
          const copy = [...prev];
          const [moved] = copy.splice(fromIndex, 1);
          copy.splice(toIndex, 0, moved);
          updatedQueue = copy;
          return copy;
        });

        // Mover nativamente en TrackPlayer sin reiniciar la canción actual
        console.log(`[useQueueController] 🎵 Ejecutando TrackPlayer.moveMediaItem(${fromIndex}, ${toIndex})`);
        await TrackPlayer.moveMediaItem(fromIndex, toIndex);
        console.log(`[useQueueController] ✅ TrackPlayer.moveMediaItem finalizado correctamente`);

        if (savePlayerState) {
          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: updatedQueue,
            activeTrackId: activeTrack?.mediaId ?? null,
            progressPosition: progress.position,
          });
        }

        setTimeout(() => {
          isReorderingRef.current = false;
          console.log(`[useQueueController] 🔓 Polling desbloqueado tras reordenar`);
        }, 800);
      } catch (e) {
        isReorderingRef.current = false;
        console.error('[useQueueController] ❌ Error al mover pista en la cola:', e);
      }
    },
    [activeTrack?.mediaId, progress.position, currentSourceRef, savePlayerState, isReorderingRef, playQueueRef, setPlayQueue]
  );

  /**
   * Vacía todas las pistas siguientes de la cola manteniendo la canción que está sonando.
   */
  const handleClearUpcomingQueue = useCallback(
    async () => {
      try {
        let activeIndex = TrackPlayer.getActiveMediaItemIndex();
        const currentQ = playQueueRef.current || [];
        if (activeIndex === null || activeIndex === -1) {
          activeIndex = activeTrack ? currentQ.findIndex((t) => t.mediaId === activeTrack.mediaId) : 0;
        }

        if (activeIndex === -1 || activeIndex >= currentQ.length - 1) {
          showToast('No hay canciones siguientes en la cola');
          return;
        }

        console.log(
          `[useQueueController] 🧹 [handleClearUpcomingQueue] Vaciando pistas siguientes después de índice ${activeIndex} (${currentQ.length - 1 - activeIndex} pistas)`
        );
        isReorderingRef.current = true;

        await TrackPlayer.removeMediaItems(activeIndex + 1, currentQ.length);

        const updatedQueue = currentQ.slice(0, activeIndex + 1);
        setPlayQueue(updatedQueue);

        if (savePlayerState) {
          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: updatedQueue,
            activeTrackId: activeTrack?.mediaId ?? null,
            progressPosition: progress.position,
          });
        }

        setTimeout(() => {
          isReorderingRef.current = false;
        }, 500);

        showToast('Cola de reproducción vaciada');
      } catch (e) {
        isReorderingRef.current = false;
        console.error('[useQueueController] ❌ Error al vaciar cola:', e);
        Alert.alert('Error', 'No se pudo vaciar la cola de reproducción.');
      }
    },
    [activeTrack, progress.position, showToast, currentSourceRef, savePlayerState, isReorderingRef, playQueueRef, setPlayQueue]
  );

  /**
   * Bloquea el polling mientras el usuario arrastra (evita que setPlayQueue del interval sobreescriba la cola en tiempo real).
   */
  const handleSetDragActive = useCallback(
    (active) => {
      console.log(`[useQueueController] 🎛️ Drag activo cambiado a: ${active}`);
      isReorderingRef.current = active;
    },
    [isReorderingRef]
  );

  /**
   * Callback para reordenar el estado de la cola cuando el usuario suelta un elemento arrastrado.
   */
  const handleReorderQueueState = useCallback(
    (fromIndex, toIndex) => {
      handleMoveQueueItem(fromIndex, toIndex);
    },
    [handleMoveQueueItem]
  );

  /**
   * Callback de sincronización con la cola nativa tras reordenar.
   */
  const handleSyncReorderNative = useCallback(async (_finalQueue) => {
    // Ya no es necesario usar clear() destructivo; handleMoveQueueItem mueve nativamente en cada drop.
  }, []);

  return {
    handleAddToQueue,
    handleRemoveFromQueue,
    handleMoveQueueItem,
    handleClearUpcomingQueue,
    handleSetDragActive,
    handleReorderQueueState,
    handleSyncReorderNative,
  };
}
