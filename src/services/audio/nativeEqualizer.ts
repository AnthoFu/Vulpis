/**
 * Puente TypeScript para el control del Ecualizador Nativo de Android (VulpisEqualizer).
 * Se comunica con Equalizer y BassBoost nativos de Android y maneja la apertura del ecualizador del sistema.
 */

import { NativeModules, Platform } from 'react-native';
import { EqualizerSettings } from '../../models/EqualizerSettings';

const { VulpisEqualizer } = NativeModules;

export function isNativeEqualizerAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(VulpisEqualizer);
}

export async function getNativeAudioSessionId(): Promise<number> {
  if (!isNativeEqualizerAvailable()) return 0;
  try {
    return await VulpisEqualizer.getAudioSessionId();
  } catch (err) {
    console.warn('[NativeEqualizer] Error al obtener audioSessionId:', err);
    return 0;
  }
}

export async function applyEqualizerSettingsToNative(
  settings: EqualizerSettings
): Promise<boolean> {
  if (!isNativeEqualizerAvailable()) return false;

  try {
    // 1. Activar / Desactivar
    await VulpisEqualizer.setEqualizerEnabled(settings.enabled);

    if (settings.enabled) {
      // 2. Aplicar las 5 bandas
      const gains = settings.bands.map((b) => b.gain);
      await VulpisEqualizer.setAllBands(gains);

      // 3. Aplicar Bass Boost
      await VulpisEqualizer.setBassBoost(settings.bassBoost);
    }

    return true;
  } catch (err) {
    console.warn('[NativeEqualizer] Error al aplicar ajustes al ecualizador nativo:', err);
    return false;
  }
}

export async function isSystemEqualizerAvailable(): Promise<boolean> {
  if (!isNativeEqualizerAvailable()) return false;
  try {
    return await VulpisEqualizer.isSystemEqualizerAvailable();
  } catch (err) {
    return false;
  }
}

export async function openSystemEqualizer(): Promise<boolean> {
  if (!isNativeEqualizerAvailable()) return false;
  try {
    return await VulpisEqualizer.openSystemEqualizer();
  } catch (err) {
    console.warn('[NativeEqualizer] Error al abrir ecualizador del sistema:', err);
    return false;
  }
}
