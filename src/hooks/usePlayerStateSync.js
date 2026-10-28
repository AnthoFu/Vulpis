import { useEffect } from 'react';
import TrackPlayer from '@rntp/player';
import { handleAutoCrossfadeProgress } from '../utils/crossfade';
import { applyReplayGainToPlayer } from '../utils/replayGain';

/**
 * @typedef {Object} ProgressState
 * @property {number} position - Posición actual en segundos.
 * @property {number} duration - Duración total de la pista en segundos.
 */

/**
 * @typedef {Object} PlayerStateSyncParams
 * @property {boolean} isPlayerInitialized - Indica si TrackPlayer ya fue inicializado nativamente.
 * @property {Function} setActiveTrack - Dispatcher para actualizar la pista activa en React State.
 * @property {Function} setIsPlaying - Dispatcher para el estado booleano de reproducción.
 * @property {Function} setRepeatMode - Dispatcher para el modo de repetición de TrackPlayer.
 * @property {Function} setIsShuffleActive - Dispatcher para el estado de reproducción aleatoria.
 * @property {Function} setPlayQueue - Dispatcher para la lista de reproducción activa en memoria.
 * @property {Function} setProgress - Dispatcher para la posición y duración actual.
 * @property {React.MutableRefObject<Array>} playQueueRef - Referencia mutable de la cola para lecturas sin stale-closure.
 * @property {React.MutableRefObject<boolean>} isReorderingRef - Bandera atómica activa durante el reordenamiento drag-and-drop.
 * @property {React.MutableRefObject<string>} currentSourceRef - Referencia a la fuente actual ('local' | 'private' | 'playlists').
 * @property {React.MutableRefObject<Object>} crossfadeSettingsRef - Referencia a la configuración de fundido cruzado.
 * @property {React.MutableRefObject<Object>} replayGainSettingsRef - Referencia a la configuración de ReplayGain.
 * @property {Function} savePlayerState - Función para persistir de forma segura el estado en AsyncStorage.
 */

/**
 * Determina si dos objetos de pista representan la misma canción activa.
 * Realiza una comparación superficial de las propiedades clave para evitar re-renders innecesarios.
 *
 * @param {Object|null} trackA - Pista previa en el estado de React.
 * @param {Object|null} trackB - Pista activa leída directamente de TrackPlayer vía JSI.
 * @returns {boolean} True si ambas pistas son funcionalmente idénticas.
 */
function areTracksEqual(trackA, trackB) {
  if (!trackA && !trackB) return true;
  if (!trackA || !trackB) return false;
  return (
    trackA.mediaId === trackB.mediaId &&
    trackA.title === trackB.title &&
    trackA.url === trackB.url
  );
}

/**
 * Compara dos colas de reproducción por identificador único de pista (`mediaId`).
 *
 * @param {Array} prevQueue - Cola almacenada previamente en React State.
 * @param {Array} currentQueue - Cola nativa obtenida de TrackPlayer.
 * @returns {boolean} True si ambas colas contienen los mismos elementos en el mismo orden.
 */
function areQueuesIdentical(prevQueue, currentQueue) {
  if (!prevQueue && !currentQueue) return true;
  if (!prevQueue || !currentQueue) return false;
  if (prevQueue.length !== currentQueue.length) return false;

  for (let i = 0; i < prevQueue.length; i++) {
    if (prevQueue[i]?.mediaId !== currentQueue[i]?.mediaId) {
      return false;
    }
  }
  return true;
}

/**
 * Evalúa si el progreso de reproducción avanzó lo suficiente como para justificar un re-render.
 *
 * @param {ProgressState} prevProgress - Progreso anterior en React State.
 * @param {number} newPos - Posición actual en segundos devuelta por JSI.
 * @param {number} newDur - Duración total en segundos devuelta por JSI.
 * @param {number} [threshold=0.25] - Umbral mínimo de cambio en segundos para actualizar.
 * @returns {boolean} True si el progreso ha cambiado significativamente.
 */
function hasProgressChanged(prevProgress, newPos, newDur, threshold = 0.25) {
  if (prevProgress.duration !== newDur) return true;
  return Math.abs(prevProgress.position - newPos) >= threshold;
}

/**
 * Hook maestro de sincronización en tiempo real entre el motor nativo de TrackPlayer y React State.
 *
 * Utiliza un bucle de polling activo cada 250ms sobre la API JSI de C++, garantizando lectura
 * sin sobrecarga del puente asíncrono y evitando desincronizaciones de UI durante transiciones.
 *
 * Responsabilidades:
 * 1. Sincronizar pista activa, progreso y estados de transporte (reproducción, shuffle, repeat).
 * 2. Mantener la cola de reproducción sincronizada con throttle (cada 1s) protegiendo operaciones de drag-and-drop.
 * 3. Aplicar normalización acústica ReplayGain al cambiar de pista.
 * 4. Gestionar el fundido cruzado automático (Crossfade) al aproximarse el fin de pista.
 * 5. Persistir periódicamente el estado en AsyncStorage evitando desbordes de memoria (`CursorWindow`).
 *
 * @param {PlayerStateSyncParams} params - Parámetros de configuración y dispatchers de estado.
 */
export default function usePlayerStateSync({
  isPlayerInitialized,
  setActiveTrack,
  setIsPlaying,
  setRepeatMode,
  setIsShuffleActive,
  setPlayQueue,
  setProgress,
  playQueueRef,
  isReorderingRef,
  currentSourceRef,
  crossfadeSettingsRef,
  replayGainSettingsRef,
  savePlayerState,
}) {
  useEffect(() => {
    if (!isPlayerInitialized) return;

    // Contadores y marcas de estado previo para optimizar operaciones y throttling
    let tick = 0;
    let lastSavedSec = -1;
    let lastSavedTrackId = null;
    let lastSavedQueueLen = -1;
    let lastAppliedTrackId = null;

    /**
     * Ciclo principal de lectura síncrona JSI y actualización de estado React.
     */
    const updatePlayerState = () => {
      try {
        // 1. Lecturas síncronas en memoria C++ vía JSI
        const currentActive = TrackPlayer.getActiveMediaItem();
        const currentPlaying = TrackPlayer.isPlaying();
        const currentProgress = TrackPlayer.getProgress();
        const currentRepeat = TrackPlayer.getRepeatMode();
        const currentShuffle = TrackPlayer.isShuffleEnabled();
        tick++;

        // 2. Sincronización de la pista activa con diffing por valor
        setActiveTrack((prev) => {
          return areTracksEqual(prev, currentActive) ? prev : currentActive;
        });

        // 3. Sincronización de estados de transporte
        setIsPlaying((prev) => (prev === currentPlaying ? prev : currentPlaying));
        setRepeatMode((prev) => (prev === currentRepeat ? prev : currentRepeat));
        setIsShuffleActive((prev) => (prev === currentShuffle ? prev : currentShuffle));

        // 4. Sincronización de la cola (throttled a 1 segundo / cada 4 ticks)
        // CRÍTICO: No sincronizar si hay un drag-and-drop en curso (isReorderingRef)
        const isReordering = isReorderingRef.current;
        const shouldSyncQueue = !isReordering && (
          tick % 4 === 0 ||
          !playQueueRef.current ||
          playQueueRef.current.length === 0
        );

        if (shouldSyncQueue) {
          const currentQueue = TrackPlayer.getQueue();
          if (currentQueue && currentQueue.length > 0) {
            setPlayQueue((prev) => {
              if (isReorderingRef.current) return prev;
              if (areQueuesIdentical(prev, currentQueue)) return prev;
              return currentQueue;
            });
          }
        }

        // 5. Sincronización de progreso con umbral de tolerancia
        const newPos = currentProgress?.position ?? 0;
        const newDur = currentProgress?.duration ?? 0;
        setProgress((prev) => {
          if (!hasProgressChanged(prev, newPos, newDur)) {
            return prev;
          }
          return {
            position: newPos,
            duration: newDur,
          };
        });

        // 6. Normalización acústica ReplayGain al cambiar de pista activa
        const activeTrackId = currentActive?.mediaId ?? null;
        if (activeTrackId && activeTrackId !== lastAppliedTrackId) {
          lastAppliedTrackId = activeTrackId;
          applyReplayGainToPlayer(currentActive, replayGainSettingsRef.current);
        }

        // 7. Gestión de rampa automática de fundido cruzado (Crossfade)
        handleAutoCrossfadeProgress({
          position: newPos,
          duration: newDur,
          isPlaying: currentPlaying,
          crossfadeEnabled: crossfadeSettingsRef.current?.enabled ?? false,
          crossfadeDuration: crossfadeSettingsRef.current?.duration ?? 4,
          activeTrackId: activeTrackId,
        });

        // 8. Persistencia periódica del estado del reproductor
        const currentQueueSnapshot = playQueueRef.current || [];
        const queueLen = currentQueueSnapshot.length;
        const timeDiff = Math.abs(newPos - lastSavedSec);

        // Guardar si cambió de pista, avanzó >= 5 segundos o varió la longitud de la cola
        const shouldSave = (
          activeTrackId !== lastSavedTrackId ||
          timeDiff >= 5 ||
          queueLen !== lastSavedQueueLen
        );

        if (shouldSave) {
          lastSavedSec = newPos;
          lastSavedTrackId = activeTrackId;
          lastSavedQueueLen = queueLen;

          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: currentQueueSnapshot,
            activeTrackId: activeTrackId,
            progressPosition: newPos,
          });
        }
      } catch (err) {
        console.warn('[usePlayerStateSync] Error en ciclo de sincronización JSI:', err);
      }
    };

    // Ejecución inmediata y configuración del intervalo de 250ms
    updatePlayerState();
    const intervalId = setInterval(updatePlayerState, 250);

    return () => clearInterval(intervalId);
  }, [isPlayerInitialized, savePlayerState]);
}
