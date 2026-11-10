import { useEffect, Dispatch, SetStateAction, MutableRefObject } from 'react';
import TrackPlayer, { RepeatMode } from '@rntp/player';
import { handleAutoCrossfadeProgress } from '../utils/crossfade';
import { applyReplayGainToPlayer } from '../utils/replayGain';
import { Track } from '../models/Track';
import { CrossfadeSettings, ReplayGainSettings } from '../models/AudioSettings';
import { EqualizerSettings } from '../models/EqualizerSettings';
import { applyEqualizerSettingsToNative } from '../services/audio';
import { SavePlayerStateParams } from './usePlayerPersistence';

export interface ProgressState {
  position: number;
  duration: number;
}

export interface PlayerStateSyncParams {
  isPlayerInitialized: boolean;
  setActiveTrack: Dispatch<SetStateAction<Track | null>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setRepeatMode: Dispatch<SetStateAction<RepeatMode>>;
  setIsShuffleActive: Dispatch<SetStateAction<boolean>>;
  setPlayQueue: Dispatch<SetStateAction<Track[]>>;
  setProgress: Dispatch<SetStateAction<ProgressState>>;
  playQueueRef: MutableRefObject<Track[]>;
  isReorderingRef: MutableRefObject<boolean>;
  currentSourceRef: MutableRefObject<string>;
  crossfadeSettingsRef: MutableRefObject<CrossfadeSettings>;
  replayGainSettingsRef: MutableRefObject<ReplayGainSettings>;
  equalizerSettingsRef?: MutableRefObject<EqualizerSettings>;
  savePlayerState?: (params: SavePlayerStateParams) => Promise<void>;
}

/**
 * Determina si dos objetos de pista representan la misma canción activa.
 * Realiza una comparación superficial de las propiedades clave para evitar re-renders innecesarios.
 *
 * @param trackA Pista previa en el estado de React.
 * @param trackB Pista activa leída directamente de TrackPlayer vía JSI.
 * @returns True si ambas pistas son funcionalmente idénticas.
 */
export function areTracksEqual(trackA?: Partial<Track> | null, trackB?: Partial<Track> | null): boolean {
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
 * @param prevQueue Cola almacenada previamente en React State.
 * @param currentQueue Cola nativa obtenida de TrackPlayer.
 * @returns True si ambas colas contienen los mismos elementos en el mismo orden.
 */
export function areQueuesIdentical(prevQueue?: Track[] | null, currentQueue?: Track[] | null): boolean {
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
 * @param prevProgress Progreso anterior en React State.
 * @param newPos Posición actual en segundos devuelta por JSI.
 * @param newDur Duración total en segundos devuelta por JSI.
 * @param threshold Umbral mínimo de cambio en segundos para actualizar.
 * @returns True si el progreso ha cambiado significativamente.
 */
export function hasProgressChanged(
  prevProgress: ProgressState,
  newPos: number,
  newDur: number,
  threshold = 0.25
): boolean {
  if (prevProgress.duration !== newDur) return true;
  return Math.abs(prevProgress.position - newPos) >= threshold;
}

/**
 * Hook maestro de sincronización en tiempo real entre el motor nativo de TrackPlayer y React State.
 *
 * Utiliza un bucle de polling activo cada 250ms sobre la API JSI de C++, garantizando lectura
 * sin sobrecarga del puente asíncrono y evitando desincronizaciones de UI durante transiciones.
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
  equalizerSettingsRef,
  savePlayerState,
}: PlayerStateSyncParams): void {
  useEffect(() => {
    if (!isPlayerInitialized) return;

    // Contadores y marcas de estado previo para optimizar operaciones y throttling
    let tick = 0;
    let lastSavedSec = -1;
    let lastSavedTrackId: string | null = null;
    let lastSavedQueueLen = -1;
    let lastAppliedTrackId: string | null = null;

    /**
     * Ciclo principal de lectura síncrona JSI y actualización de estado React.
     */
    const updatePlayerState = () => {
      try {
        // 1. Lecturas síncronas en memoria C++ vía JSI
        const currentActive = TrackPlayer.getActiveMediaItem() as Track | null;
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
          const currentQueue = TrackPlayer.getQueue() as Track[];
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

        // 6. Normalización acústica ReplayGain y ecualización al cambiar de pista activa
        const activeTrackId = currentActive?.mediaId ?? null;
        if (activeTrackId && activeTrackId !== lastAppliedTrackId) {
          lastAppliedTrackId = activeTrackId;
          applyReplayGainToPlayer(currentActive, replayGainSettingsRef.current);
          if (equalizerSettingsRef?.current) {
            applyEqualizerSettingsToNative(equalizerSettingsRef.current).catch(() => {});
          }
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

        if (shouldSave && savePlayerState) {
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
