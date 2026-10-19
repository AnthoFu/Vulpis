import { useEffect } from 'react';
import TrackPlayer from '@rntp/player';
import { handleAutoCrossfadeProgress } from '../utils/crossfade';
import { applyReplayGainToPlayer } from '../utils/replayGain';

/**
 * Hook para sincronizar el estado nativo de TrackPlayer (JSI) con React State.
 * Ejecuta un ciclo de polling de 250ms para capturar cambios de pista, progreso,
 * reproducción, modos de repetición/aleatorio, aplicación de ReplayGain,
 * fundido cruzado automático (Crossfade) y persistencia periódica de estado.
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

    let tick = 0;
    let lastSavedSec = -1;
    let lastSavedTrackId = null;
    let lastSavedQueueLen = -1;
    let lastAppliedTrackId = null;

    const updatePlayerState = () => {
      try {
        const currentActive = TrackPlayer.getActiveMediaItem();
        const currentPlaying = TrackPlayer.isPlaying();
        const currentProgress = TrackPlayer.getProgress();
        const currentRepeat = TrackPlayer.getRepeatMode();
        const currentShuffle = TrackPlayer.isShuffleEnabled();
        tick++;

        setActiveTrack((prev) => {
          if (!prev && !currentActive) return prev;
          if (
            prev &&
            currentActive &&
            prev.mediaId === currentActive.mediaId &&
            prev.title === currentActive.title &&
            prev.url === currentActive.url
          ) {
            return prev;
          }
          return currentActive;
        });

        setIsPlaying((prev) => (prev === currentPlaying ? prev : currentPlaying));
        setRepeatMode((prev) => (prev === currentRepeat ? prev : currentRepeat));
        setIsShuffleActive((prev) => (prev === currentShuffle ? prev : currentShuffle));

        // Solo sincronizar la cola de TrackPlayer cada 1 segundo (tick % 4 === 0) y NUNCA durante un reordenamiento activo
        if (!isReorderingRef.current && (tick % 4 === 0 || !playQueueRef.current || playQueueRef.current.length === 0)) {
          const currentQueue = TrackPlayer.getQueue();
          if (currentQueue && currentQueue.length > 0) {
            setPlayQueue((prev) => {
              if (isReorderingRef.current) return prev;
              if (!prev || prev.length === 0) return currentQueue;
              if (prev.length === currentQueue.length) {
                let identical = true;
                for (let i = 0; i < prev.length; i++) {
                  if (prev[i]?.mediaId !== currentQueue[i]?.mediaId) {
                    identical = false;
                    break;
                  }
                }
                if (identical) return prev;
              }
              return currentQueue;
            });
          }
        }

        setProgress((prev) => {
          const newPos = currentProgress?.position ?? 0;
          const newDur = currentProgress?.duration ?? 0;
          if (Math.abs(prev.position - newPos) < 0.25 && prev.duration === newDur) {
            return prev;
          }
          return {
            position: newPos,
            duration: newDur,
          };
        });

        // Aplicar normalización de volumen ReplayGain cuando cambia la pista activa
        const activeTrackId = currentActive?.mediaId ?? null;
        if (activeTrackId && activeTrackId !== lastAppliedTrackId) {
          lastAppliedTrackId = activeTrackId;
          applyReplayGainToPlayer(currentActive, replayGainSettingsRef.current);
        }

        // Manejo automático de fundido cruzado cerca del final de la pista
        handleAutoCrossfadeProgress({
          position: currentProgress?.position ?? 0,
          duration: currentProgress?.duration ?? 0,
          isPlaying: currentPlaying,
          crossfadeEnabled: crossfadeSettingsRef.current?.enabled ?? false,
          crossfadeDuration: crossfadeSettingsRef.current?.duration ?? 4,
          activeTrackId: activeTrackId,
        });

        // Verificación de persistencia del estado
        const pos = currentProgress?.position ?? 0;
        const trackId = currentActive?.mediaId ?? null;
        const currentQueueSnapshot = playQueueRef.current || [];
        const queueLen = currentQueueSnapshot.length;

        // Guardar si cambió la pista, o si el progreso avanzó >= 5 segundos, o si la longitud de la cola cambió
        const timeDiff = Math.abs(pos - lastSavedSec);
        if (trackId !== lastSavedTrackId || timeDiff >= 5 || queueLen !== lastSavedQueueLen) {
          lastSavedSec = pos;
          lastSavedTrackId = trackId;
          lastSavedQueueLen = queueLen;

          savePlayerState({
            currentSource: currentSourceRef.current,
            playQueue: currentQueueSnapshot,
            activeTrackId: trackId,
            progressPosition: pos,
          });
        }
      } catch (e) {
        console.log('[usePlayerStateSync] Error actualizando estado de TrackPlayer:', e);
      }
    };

    updatePlayerState();
    const interval = setInterval(updatePlayerState, 250);

    return () => clearInterval(interval);
  }, [isPlayerInitialized, savePlayerState]);
}
