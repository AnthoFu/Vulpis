import { useState, useEffect, useRef } from 'react';
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

/**
 * Hook para la gestión y sincronización de los ajustes acústicos (Fundido Cruzado y ReplayGain).
 */
export default function useAudioSettings({ activeTrack, showToast }) {
  const [crossfadeSettings, setCrossfadeSettings] = useState(DEFAULT_CROSSFADE_SETTINGS);
  const crossfadeSettingsRef = useRef(crossfadeSettings);

  const [replayGainSettings, setReplayGainSettings] = useState(DEFAULT_REPLAYGAIN_SETTINGS);
  const replayGainSettingsRef = useRef(replayGainSettings);

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

  const handleUpdateCrossfade = async (newSettings) => {
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

  const handleUpdateReplayGain = async (newSettings) => {
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
