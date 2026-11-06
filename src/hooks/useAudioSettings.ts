import { useState, useEffect, useRef, MutableRefObject } from 'react';
import {
  getCrossfadeSettings,
  saveCrossfadeSettings,
  DEFAULT_CROSSFADE_SETTINGS,
} from '../utils/crossfade';
import {
  getReplayGainSettings,
  saveReplayGainSettings,
  DEFAULT_REPLAYGAIN_SETTINGS,
  applyReplayGainToPlayer,
} from '../utils/replayGain';
import { CrossfadeSettings, ReplayGainSettings } from '../models/AudioSettings';
import { Track } from '../models/Track';

export interface UseAudioSettingsParams {
  activeTrack?: Track | null;
  showToast?: (message: string) => void;
}

export interface UseAudioSettingsReturn {
  crossfadeSettings: CrossfadeSettings;
  crossfadeSettingsRef: MutableRefObject<CrossfadeSettings>;
  handleUpdateCrossfade: (newSettings: CrossfadeSettings) => Promise<void>;
  replayGainSettings: ReplayGainSettings;
  replayGainSettingsRef: MutableRefObject<ReplayGainSettings>;
  handleUpdateReplayGain: (newSettings: ReplayGainSettings) => Promise<void>;
}

/**
 * Hook para la gestión y sincronización de los ajustes acústicos (Fundido Cruzado y ReplayGain).
 */
export default function useAudioSettings({
  activeTrack,
  showToast,
}: UseAudioSettingsParams): UseAudioSettingsReturn {
  const [crossfadeSettings, setCrossfadeSettings] = useState<CrossfadeSettings>(DEFAULT_CROSSFADE_SETTINGS);
  const crossfadeSettingsRef = useRef<CrossfadeSettings>(crossfadeSettings);

  const [replayGainSettings, setReplayGainSettings] = useState<ReplayGainSettings>(DEFAULT_REPLAYGAIN_SETTINGS);
  const replayGainSettingsRef = useRef<ReplayGainSettings>(replayGainSettings);

  useEffect(() => {
    crossfadeSettingsRef.current = crossfadeSettings;
  }, [crossfadeSettings]);

  useEffect(() => {
    replayGainSettingsRef.current = replayGainSettings;
  }, [replayGainSettings]);

  // Carga inicial de ajustes acústicos
  useEffect(() => {
    getCrossfadeSettings().then(setCrossfadeSettings);
    getReplayGainSettings().then((loaded) => {
      setReplayGainSettings(loaded);
      if (activeTrack) {
        applyReplayGainToPlayer(activeTrack, loaded);
      }
    });
  }, []);

  const handleUpdateCrossfade = async (newSettings: CrossfadeSettings): Promise<void> => {
    setCrossfadeSettings(newSettings);
    await saveCrossfadeSettings(newSettings);
    if (showToast) {
      showToast(
        newSettings.enabled
          ? `Fundido cruzado activado (${newSettings.duration}s)`
          : 'Fundido cruzado desactivado'
      );
    }
  };

  const handleUpdateReplayGain = async (newSettings: ReplayGainSettings): Promise<void> => {
    setReplayGainSettings(newSettings);
    await saveReplayGainSettings(newSettings);
    if (activeTrack) {
      applyReplayGainToPlayer(activeTrack, newSettings);
    }
    if (showToast) {
      showToast(
        newSettings.enabled
          ? `ReplayGain activado (Modo: ${newSettings.mode === 'album' ? 'Álbum' : 'Pista'})`
          : 'ReplayGain desactivado'
      );
    }
  };

  return {
    crossfadeSettings,
    crossfadeSettingsRef,
    handleUpdateCrossfade,
    replayGainSettings,
    replayGainSettingsRef,
    handleUpdateReplayGain,
  };
}
