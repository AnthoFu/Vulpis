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
import {
  applyEqualizerSettingsToNative,
  isSystemEqualizerAvailable as checkSystemEqualizer,
  openSystemEqualizer as launchSystemEqualizer,
} from '../services/audio';

export interface UseEqualizerParams {
  showToast?: (message: string) => void;
}

export interface UseEqualizerReturn {
  equalizerSettings: EqualizerSettings;
  equalizerSettingsRef: MutableRefObject<EqualizerSettings>;
  isEqualizerOpen: boolean;
  setIsEqualizerOpen: Dispatch<SetStateAction<boolean>>;
  isSystemEqualizerAvailable: boolean;
  handleToggleEqualizer: (enabled: boolean) => Promise<void>;
  handleSelectPreset: (presetId: EqualizerPresetId) => Promise<void>;
  handleUpdateBandGain: (bandIndex: number, gain: number) => Promise<void>;
  handleUpdateBassBoost: (bassBoost: number) => Promise<void>;
  handleResetEqualizer: () => Promise<void>;
  handleOpenSystemEqualizer: () => Promise<void>;
}

/**
 * Hook para la gestión del estado, persistencia y presets del Ecualizador de Audio.
 * Sincroniza los cambios con el almacenamiento local y el puente nativo de Android.
 */
export default function useEqualizer({
  showToast,
}: UseEqualizerParams = {}): UseEqualizerReturn {
  const [equalizerSettings, setEqualizerSettings] = useState<EqualizerSettings>(DEFAULT_EQUALIZER_SETTINGS);
  const equalizerSettingsRef = useRef<EqualizerSettings>(equalizerSettings);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isSystemEqualizerAvailable, setIsSystemEqualizerAvailable] = useState<boolean>(false);

  useEffect(() => {
    equalizerSettingsRef.current = equalizerSettings;
  }, [equalizerSettings]);

  // Carga inicial desde almacenamiento persistente y detección de capacidades del sistema
  useEffect(() => {
    getEqualizerSettings().then((loaded) => {
      setEqualizerSettings(loaded);
      applyEqualizerSettingsToNative(loaded).catch(() => {});
    });

    checkSystemEqualizer().then((available) => {
      setIsSystemEqualizerAvailable(available);
    });
  }, []);

  const handleToggleEqualizer = async (enabled: boolean): Promise<void> => {
    const updated: EqualizerSettings = {
      ...equalizerSettings,
      enabled,
    };
    setEqualizerSettings(updated);
    await saveEqualizerSettings(updated);
    await applyEqualizerSettingsToNative(updated);
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
    await applyEqualizerSettingsToNative(updated);
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
    await applyEqualizerSettingsToNative(updated);
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
    await applyEqualizerSettingsToNative(updated);
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
    await applyEqualizerSettingsToNative(updated);
    if (showToast) {
      showToast('Ecualizador restablecido a plano');
    }
  };

  const handleOpenSystemEqualizer = async (): Promise<void> => {
    const success = await launchSystemEqualizer();
    if (!success && showToast) {
      showToast('No se encontró ecualizador del sistema');
    }
  };

  return {
    equalizerSettings,
    equalizerSettingsRef,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isSystemEqualizerAvailable,
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
    handleOpenSystemEqualizer,
  };
}
