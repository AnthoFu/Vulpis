import { useState, useEffect, useRef, MutableRefObject, Dispatch, SetStateAction } from 'react';
import {
  EqualizerSettings,
  EqualizerPresetId,
  DEFAULT_EQUALIZER_SETTINGS,
} from '../models/EqualizerSettings';
import {
  getEqualizerSettings,
  saveEqualizerSettings,
  applyPresetToBands,
  detectPresetFromGains,
} from '../utils/equalizer';

export interface UseEqualizerParams {
  showToast?: (message: string) => void;
}

export interface UseEqualizerReturn {
  equalizerSettings: EqualizerSettings;
  equalizerSettingsRef: MutableRefObject<EqualizerSettings>;
  isEqualizerOpen: boolean;
  setIsEqualizerOpen: Dispatch<SetStateAction<boolean>>;
  handleToggleEqualizer: (enabled: boolean) => Promise<void>;
  handleSelectPreset: (presetId: EqualizerPresetId) => Promise<void>;
  handleUpdateBandGain: (bandIndex: number, gain: number) => Promise<void>;
  handleUpdateBassBoost: (bassBoost: number) => Promise<void>;
  handleResetEqualizer: () => Promise<void>;
}

/**
 * Hook para la gestión del estado, persistencia y presets del Ecualizador de Audio.
 */
export default function useEqualizer({
  showToast,
}: UseEqualizerParams = {}): UseEqualizerReturn {
  const [equalizerSettings, setEqualizerSettings] = useState<EqualizerSettings>(DEFAULT_EQUALIZER_SETTINGS);
  const equalizerSettingsRef = useRef<EqualizerSettings>(equalizerSettings);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);

  useEffect(() => {
    equalizerSettingsRef.current = equalizerSettings;
  }, [equalizerSettings]);

  // Carga inicial desde almacenamiento persistente
  useEffect(() => {
    getEqualizerSettings().then((loaded) => {
      setEqualizerSettings(loaded);
    });
  }, []);

  const handleToggleEqualizer = async (enabled: boolean): Promise<void> => {
    const updated: EqualizerSettings = {
      ...equalizerSettings,
      enabled,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
    if (showToast) {
      showToast(enabled ? 'Ecualizador activado' : 'Ecualizador desactivado');
    }
  };

  const handleSelectPreset = async (presetId: EqualizerPresetId): Promise<void> => {
    const { bands, bassBoost } = applyPresetToBands(presetId);
    const updated: EqualizerSettings = {
      ...equalizerSettings,
      presetId,
      bands,
      bassBoost,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
  };

  const handleUpdateBandGain = async (bandIndex: number, gain: number): Promise<void> => {
    const clampedGain = Math.round(Math.max(-10, Math.min(10, gain)));
    const updatedBands = equalizerSettings.bands.map((b, idx) =>
      idx === bandIndex ? { ...b, gain: clampedGain } : b
    );
    const detectedPreset = detectPresetFromGains(updatedBands, equalizerSettings.bassBoost);

    const updated: EqualizerSettings = {
      ...equalizerSettings,
      bands: updatedBands,
      presetId: detectedPreset,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
  };

  const handleUpdateBassBoost = async (bassBoost: number): Promise<void> => {
    const clamped = Math.round(Math.max(0, Math.min(10, bassBoost)));
    const detectedPreset = detectPresetFromGains(equalizerSettings.bands, clamped);

    const updated: EqualizerSettings = {
      ...equalizerSettings,
      bassBoost: clamped,
      presetId: detectedPreset,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
  };

  const handleResetEqualizer = async (): Promise<void> => {
    const { bands, bassBoost } = applyPresetToBands('flat');
    const updated: EqualizerSettings = {
      ...equalizerSettings,
      presetId: 'flat',
      bands,
      bassBoost,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
    if (showToast) {
      showToast('Ecualizador restablecido a plano');
    }
  };

  return {
    equalizerSettings,
    equalizerSettingsRef,
    isEqualizerOpen,
    setIsEqualizerOpen,
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
  };
}
