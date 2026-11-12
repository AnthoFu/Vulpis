/**
 * Utilidades de persistencia y cálculo acústico para el Ecualizador de Audio.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EqualizerSettings,
  EqualizerBand,
  EqualizerPresetId,
  DEFAULT_EQUALIZER_SETTINGS,
  EQUALIZER_PRESETS,
  EQUALIZER_DEFAULT_BANDS,
} from '../models/EqualizerSettings';

export const EQUALIZER_SETTINGS_KEY = 'vulpis_equalizer_settings';

export { DEFAULT_EQUALIZER_SETTINGS, EQUALIZER_PRESETS, EQUALIZER_DEFAULT_BANDS };

/**
 * Obtiene la configuración del ecualizador guardada en AsyncStorage.
 */
export async function getEqualizerSettings(): Promise<EqualizerSettings> {
  try {
    const raw = await AsyncStorage.getItem(EQUALIZER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validar que las 5 bandas existan y tengan valores numéricos seguros
      const safeBands: EqualizerBand[] = EQUALIZER_DEFAULT_BANDS.map((defBand, idx) => {
        const savedBand = parsed.bands?.[idx];
        const gain = typeof savedBand?.gain === 'number' && !isNaN(savedBand.gain)
          ? Math.max(-10, Math.min(10, savedBand.gain))
          : defBand.gain;
        return {
          ...defBand,
          gain,
        };
      });

      return {
        enabled: Boolean(parsed.enabled),
        presetId: parsed.presetId && EQUALIZER_PRESETS[parsed.presetId as EqualizerPresetId]
          ? (parsed.presetId as EqualizerPresetId)
          : 'flat',
        bands: safeBands,
        bassBoost: typeof parsed.bassBoost === 'number' && !isNaN(parsed.bassBoost)
          ? Math.max(0, Math.min(10, parsed.bassBoost))
          : 0,
      };
    }
  } catch (error) {
    console.error('[Equalizer] Error al cargar configuración del ecualizador:', error);
  }
  return DEFAULT_EQUALIZER_SETTINGS;
}

/**
 * Guarda la configuración del ecualizador en AsyncStorage.
 */
export async function saveEqualizerSettings(settings: EqualizerSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(EQUALIZER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Equalizer] Error al guardar configuración del ecualizador:', error);
  }
}

/**
 * Aplica las ganancias y refuerzo de graves de un preset a una lista de bandas.
 */
export function applyPresetToBands(presetId: EqualizerPresetId): {
  bands: EqualizerBand[];
  bassBoost: number;
} {
  const preset = EQUALIZER_PRESETS[presetId] || EQUALIZER_PRESETS.flat;
  const updatedBands: EqualizerBand[] = EQUALIZER_DEFAULT_BANDS.map((band, idx) => ({
    ...band,
    gain: preset.gains[idx] ?? 0,
  }));

  return {
    bands: updatedBands,
    bassBoost: preset.bassBoost ?? 0,
  };
}

/**
 * Comprueba si la configuración actual coincide con un preset conocido o si es personalizada.
 */
export function detectPresetFromGains(
  bands: EqualizerBand[],
  bassBoost: number
): EqualizerPresetId {
  const presetEntries = Object.entries(EQUALIZER_PRESETS) as [EqualizerPresetId, typeof EQUALIZER_PRESETS[EqualizerPresetId]][];

  for (const [id, preset] of presetEntries) {
    if (id === 'custom') continue;
    const matchesGains = bands.every((b, idx) => b.gain === preset.gains[idx]);
    const matchesBass = bassBoost === preset.bassBoost;
    if (matchesGains && matchesBass) {
      return id;
    }
  }

  return 'custom';
}
