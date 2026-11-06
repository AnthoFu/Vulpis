import { useState, useEffect, useRef } from 'react';
import TrackPlayer from '@rntp/player';
import { Track } from '../models/Track';

export const SLEEP_TIMER_MODES = {
  MINUTES_15: '15m',
  MINUTES_30: '30m',
  MINUTES_60: '60m',
  END_OF_TRACK: 'end_of_track',
} as const;

export type SleepTimerMode = typeof SLEEP_TIMER_MODES[keyof typeof SLEEP_TIMER_MODES] | number | null;

export interface UseSleepTimerParams {
  isPlaying?: boolean;
  activeTrack?: Track | null;
  showToast?: (message: string) => void;
}

export interface UseSleepTimerReturn {
  isTimerActive: boolean;
  timerMode: SleepTimerMode;
  secondsRemaining: number;
  timeRemainingFormatted: string | null;
  startSleepTimer: (mode: SleepTimerMode | string) => void;
  cancelSleepTimer: () => void;
}

export default function useSleepTimer({
  activeTrack,
  showToast,
}: UseSleepTimerParams): UseSleepTimerReturn {
  const [timerMode, setTimerMode] = useState<SleepTimerMode>(null);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [trackedTrackId, setTrackedTrackId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const timerModeRef = useRef<SleepTimerMode>(timerMode);
  const targetTimestampRef = useRef<number | null>(targetTimestamp);
  const trackedTrackIdRef = useRef<string | null>(trackedTrackId);
  const activeTrackRef = useRef<Track | null | undefined>(activeTrack);

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
    activeTrackRef.current = activeTrack;

    if (
      timerModeRef.current === SLEEP_TIMER_MODES.END_OF_TRACK &&
      trackedTrackIdRef.current &&
      activeTrack
    ) {
      // Si la pista activa cambió respecto a la que estaba sonando cuando se activó el temporizador
      if (activeTrack.mediaId !== trackedTrackIdRef.current) {
        console.log('[useSleepTimer] Pista finalizada en modo end_of_track. Deteniendo reproducción...');
        try {
          TrackPlayer.pause();
        } catch (err: any) {
          console.error('[useSleepTimer] Error pausando TrackPlayer:', err);
        }
        cancelTimerInternal('Temporizador: Pista finalizada, reproducción detenida');
      }
    }
  }, [activeTrack?.mediaId]);

  const cancelTimerInternal = (toastMessage?: string): void => {
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

  const cancelSleepTimer = (): void => {
    cancelTimerInternal('Temporizador de apagado desactivado');
  };

  const startSleepTimer = (mode: SleepTimerMode | string): void => {
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
      setTimerMode(mode as SleepTimerMode);
      setTargetTimestamp(target);
      setTrackedTrackId(null);
      setSecondsRemaining(minutes * 60);
      timerModeRef.current = mode as SleepTimerMode;
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

    const checkTimer = (): void => {
      const now = Date.now();
      const target = targetTimestampRef.current ?? 0;
      const remainingMs = target - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      if (remainingMs <= 0) {
        console.log('[useSleepTimer] Tiempo transcurrido. Deteniendo reproducción automáticamente...');
        try {
          TrackPlayer.pause();
        } catch (err: any) {
          console.error('[useSleepTimer] Error pausando TrackPlayer:', err);
        }
        cancelTimerInternal('Temporizador de apagado: Reproducción detenida');
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [timerMode, targetTimestamp]);

  // Formato para visualización en la UI
  const formatRemainingTime = (): string | null => {
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
