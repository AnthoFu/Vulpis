import { useState, useEffect, useRef } from 'react';
import TrackPlayer from '@rntp/player';

export const SLEEP_TIMER_MODES = {
  MINUTES_15: '15m',
  MINUTES_30: '30m',
  MINUTES_60: '60m',
  END_OF_TRACK: 'end_of_track',
};

export default function useSleepTimer({ isPlaying, activeTrack, showToast }) {
  const [timerMode, setTimerMode] = useState(null); // '15m' | '30m' | '60m' | 'end_of_track' | null
  const [targetTimestamp, setTargetTimestamp] = useState(null);
  const [trackedTrackId, setTrackedTrackId] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const timerModeRef = useRef(timerMode);
  const targetTimestampRef = useRef(targetTimestamp);
  const trackedTrackIdRef = useRef(trackedTrackId);
  const activeTrackRef = useRef(activeTrack);

  useEffect(() => {
    timerModeRef.current = timerMode;
  }, [timerMode]);

  useEffect(() => {
    targetTimestampRef.current = targetTimestamp;
  }, [targetTimestamp]);

  useEffect(() => {
    trackedTrackIdRef.current = trackedTrackId;
  }, [trackedTrackId]);

  // Manejo de cambio de pista para la opción "Al finalizar la pista actual"
  useEffect(() => {
    const prevTrack = activeTrackRef.current;
    activeTrackRef.current = activeTrack;

    if (
      timerModeRef.current === SLEEP_TIMER_MODES.END_OF_TRACK &&
      trackedTrackIdRef.current &&
      activeTrack
    ) {
      // Si la pista activa cambió respecto a la que estaba sonando cuando se activó el temporizador
      if (activeTrack.mediaId !== trackedTrackIdRef.current) {
        console.log('[useSleepTimer] Pista finalizada en modo end_of_track. Deteniendo reproducción...');
        TrackPlayer.pause().catch(err => console.error('[useSleepTimer] Error pausando TrackPlayer:', err));
        cancelTimerInternal('Temporizador: Pista finalizada, reproducción detenida');
      }
    }
  }, [activeTrack?.mediaId]);

  const cancelTimerInternal = (toastMessage) => {
    setTimerMode(null);
    setTargetTimestamp(null);
    setTrackedTrackId(null);
    setSecondsRemaining(0);
    timerModeRef.current = null;
    targetTimestampRef.current = null;
    trackedTrackIdRef.current = null;
    if (toastMessage && showToast) {
      showToast(toastMessage);
    }
  };

  const cancelSleepTimer = () => {
    cancelTimerInternal('Temporizador de apagado desactivado');
  };

  const startSleepTimer = (mode) => {
    if (!mode || mode === 'off') {
      cancelSleepTimer();
      return;
    }

    if (mode === SLEEP_TIMER_MODES.END_OF_TRACK) {
      const currentTrackId = activeTrackRef.current?.mediaId || null;
      setTimerMode(SLEEP_TIMER_MODES.END_OF_TRACK);
      setTargetTimestamp(null);
      setTrackedTrackId(currentTrackId);
      setSecondsRemaining(0);
      timerModeRef.current = SLEEP_TIMER_MODES.END_OF_TRACK;
      trackedTrackIdRef.current = currentTrackId;

      if (showToast) {
        showToast('Temporizador: Se detendrá al finalizar la pista actual');
      }
      return;
    }

    let minutes = 0;
    if (mode === SLEEP_TIMER_MODES.MINUTES_15 || mode === 15) minutes = 15;
    else if (mode === SLEEP_TIMER_MODES.MINUTES_30 || mode === 30) minutes = 30;
    else if (mode === SLEEP_TIMER_MODES.MINUTES_60 || mode === 60) minutes = 60;
    else if (typeof mode === 'number') minutes = mode;

    if (minutes > 0) {
      const target = Date.now() + minutes * 60 * 1000;
      setTimerMode(mode);
      setTargetTimestamp(target);
      setTrackedTrackId(null);
      setSecondsRemaining(minutes * 60);
      timerModeRef.current = mode;
      targetTimestampRef.current = target;

      if (showToast) {
        showToast(`Temporizador establecido en ${minutes} minutos`);
      }
    }
  };

  // Intervalo de cuenta regresiva para modos por tiempo (15m, 30m, 60m)
  useEffect(() => {
    if (!timerMode || timerMode === SLEEP_TIMER_MODES.END_OF_TRACK || !targetTimestamp) {
      return;
    }

    const checkTimer = () => {
      const now = Date.now();
      const remainingMs = targetTimestampRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      if (remainingMs <= 0) {
        console.log('[useSleepTimer] Tiempo transcurrido. Deteniendo reproducción automáticamente...');
        TrackPlayer.pause().catch(err => console.error('[useSleepTimer] Error pausando TrackPlayer:', err));
        cancelTimerInternal('Temporizador de apagado: Reproducción detenida');
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [timerMode, targetTimestamp]);

  // Formato para visualización en la UI
  const formatRemainingTime = () => {
    if (!timerMode) return null;
    if (timerMode === SLEEP_TIMER_MODES.END_OF_TRACK) return 'Fin de pista';

    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    isTimerActive: timerMode !== null,
    timerMode,
    secondsRemaining,
    timeRemainingFormatted: formatRemainingTime(),
    startSleepTimer,
    cancelSleepTimer,
  };
}
