import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from '@rntp/player';
import { setActiveBaselineVolume } from './crossfade';

export const REPLAYGAIN_SETTINGS_KEY = 'vulpis_replaygain_settings';

export const DEFAULT_REPLAYGAIN_SETTINGS = {
  enabled: false,
  mode: 'track', // 'track' | 'album'
  preampWithRG: 0, // dB (-12 a +12 dB)
  preampWithoutRG: -6, // dB (-12 a +12 dB) - atenúa por defecto para igualar la sonoridad estándar de 89 dB SPL
  preventClipping: true, // Prevenir distorsión digital si el pico excede el límite
};

/**
 * Obtiene la configuración de ReplayGain guardada en AsyncStorage.
 */
export async function getReplayGainSettings() {
  try {
    const raw = await AsyncStorage.getItem(REPLAYGAIN_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_REPLAYGAIN_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('[ReplayGain] Error al leer ajustes de normalización:', e);
  }
  return DEFAULT_REPLAYGAIN_SETTINGS;
}

/**
 * Guarda la configuración de ReplayGain en AsyncStorage.
 */
export async function saveReplayGainSettings(settings) {
  try {
    await AsyncStorage.setItem(REPLAYGAIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[ReplayGain] Error al guardar ajustes de normalización:', e);
  }
}

/**
 * Parsea un valor de ganancia en decibelios (dB) desde una cadena o número.
 * Ejemplos: "-6.20 dB", "+2.5 dB", "-3.1", -6.2 -> -6.2
 */
export function parseGainDb(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (!val || typeof val !== 'string') return null;
  const match = val.match(/([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

/**
 * Parsea un valor de amplitud de pico (Peak) desde una cadena o número.
 * Ejemplos: "0.985200", "1.02", 0.98 -> 0.9852
 */
export function parsePeak(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (!val || typeof val !== 'string') return null;
  const match = val.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

/**
 * Parsea la etiqueta iTunNORM (Apple iTunes / Sound Check).
 * Formato: " 000003E8 000003E8 00001000 00001000 00000000 00000000 00007FFF 00007FFF ..."
 * El primer valor hex representa la energía/sonoridad relativa a 1000 (89 dB SPL).
 */
export function parseITunNorm(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 8) {
    const val = parseInt(parts[0], 16);
    if (!isNaN(val) && val > 0) {
      // Cálculo estándar de ganancia SoundCheck: -10 * log10(val / 1000)
      const gain = -10 * Math.log10(val / 1000);
      let peak = null;
      const peakVal = parseInt(parts[2], 16);
      if (!isNaN(peakVal) && peakVal > 0) {
        peak = Math.min(1.0, peakVal / 32768);
      }
      return { gain, peak };
    }
  }
  return null;
}

/**
 * Extrae metadatos ReplayGain de objetos de etiquetas devueltos por jsmediatags.
 */
export function extractReplayGainFromJsMediaTags(tags) {
  if (!tags) return null;
  const rg = {
    trackGain: null,
    trackPeak: null,
    albumGain: null,
    albumPeak: null,
  };

  // 1. Revisar propiedades directas
  for (const key of Object.keys(tags)) {
    const lowerKey = key.toLowerCase();
    const rawVal = tags[key];
    const val = typeof rawVal === 'object' && rawVal !== null
      ? (rawVal.data || rawVal.description || rawVal.value || '')
      : String(rawVal || '');

    if (lowerKey === 'replaygain_track_gain' || lowerKey === 'replaygain_gain' || lowerKey === 'rg_track_gain') {
      rg.trackGain = parseGainDb(val);
    } else if (lowerKey === 'replaygain_track_peak' || lowerKey === 'rg_track_peak') {
      rg.trackPeak = parsePeak(val);
    } else if (lowerKey === 'replaygain_album_gain' || lowerKey === 'rg_album_gain') {
      rg.albumGain = parseGainDb(val);
    } else if (lowerKey === 'replaygain_album_peak' || lowerKey === 'rg_album_peak') {
      rg.albumPeak = parsePeak(val);
    } else if (lowerKey === 'itunnorm' || lowerKey.includes('itunnorm')) {
      const norm = parseITunNorm(val);
      if (norm) {
        if (rg.trackGain === null) rg.trackGain = norm.gain;
        if (rg.trackPeak === null && norm.peak !== null) rg.trackPeak = norm.peak;
      }
    }
  }

  // 2. Revisar etiquetas TXXX si existen
  if (tags.TXXX) {
    const txxxList = Array.isArray(tags.TXXX) ? tags.TXXX : [tags.TXXX];
    for (const item of txxxList) {
      const desc = item?.data?.user_description || item?.description || item?.user_description || '';
      const val = item?.data?.data || item?.data || item?.value || '';
      const descLower = String(desc).toLowerCase();
      const valStr = String(val);

      if (descLower === 'replaygain_track_gain' || descLower === 'replaygain_gain') {
        rg.trackGain = parseGainDb(valStr);
      } else if (descLower === 'replaygain_track_peak') {
        rg.trackPeak = parsePeak(valStr);
      } else if (descLower === 'replaygain_album_gain') {
        rg.albumGain = parseGainDb(valStr);
      } else if (descLower === 'replaygain_album_peak') {
        rg.albumPeak = parsePeak(valStr);
      } else if (descLower === 'itunnorm' || descLower.includes('itunnorm')) {
        const norm = parseITunNorm(valStr);
        if (norm) {
          if (rg.trackGain === null) rg.trackGain = norm.gain;
          if (rg.trackPeak === null && norm.peak !== null) rg.trackPeak = norm.peak;
        }
      }
    }
  }

  // 3. Revisar comentario ID3 con SoundCheck
  if (tags.comment) {
    const commText = typeof tags.comment === 'object'
      ? (tags.comment.text || tags.comment.data || '')
      : String(tags.comment);
    if (commText && (commText.includes(' 00000') || commText.toLowerCase().includes('itunnorm'))) {
      const norm = parseITunNorm(commText);
      if (norm) {
        if (rg.trackGain === null) rg.trackGain = norm.gain;
        if (rg.trackPeak === null && norm.peak !== null) rg.trackPeak = norm.peak;
      }
    }
  }

  const hasAny = rg.trackGain !== null || rg.trackPeak !== null || rg.albumGain !== null || rg.albumPeak !== null;
  return hasAny ? rg : null;
}

/**
 * Calcula el multiplicador de volumen acústico (0.0 a 1.0) para una pista dada según los ajustes de ReplayGain.
 */
export function calculateTrackVolumeMultiplier(track, settings = DEFAULT_REPLAYGAIN_SETTINGS) {
  if (!settings || !settings.enabled) {
    return 1.0;
  }

  const mode = settings.mode || 'track';
  const preampWithRG = typeof settings.preampWithRG === 'number' ? settings.preampWithRG : 0;
  const preampWithoutRG = typeof settings.preampWithoutRG === 'number' ? settings.preampWithoutRG : -6;
  const preventClipping = settings.preventClipping !== false;

  let gainDb = null;
  let peak = null;

  if (track) {
    const rg = track.replayGain || {};
    const trackGain = typeof rg.trackGain === 'number' ? rg.trackGain : (typeof track.trackGain === 'number' ? track.trackGain : null);
    const albumGain = typeof rg.albumGain === 'number' ? rg.albumGain : (typeof track.albumGain === 'number' ? track.albumGain : null);
    const trackPeak = typeof rg.trackPeak === 'number' ? rg.trackPeak : (typeof track.trackPeak === 'number' ? track.trackPeak : null);
    const albumPeak = typeof rg.albumPeak === 'number' ? rg.albumPeak : (typeof track.albumPeak === 'number' ? track.albumPeak : null);

    if (mode === 'album') {
      gainDb = albumGain !== null ? albumGain : trackGain;
      peak = albumPeak !== null ? albumPeak : (trackPeak !== null ? trackPeak : 1.0);
    } else {
      // Modo 'track'
      gainDb = trackGain !== null ? trackGain : albumGain;
      peak = trackPeak !== null ? trackPeak : (albumPeak !== null ? albumPeak : 1.0);
    }
  }

  let finalGainDb;
  if (gainDb !== null) {
    finalGainDb = gainDb + preampWithRG;
  } else {
    // Si la canción no tiene etiquetas ReplayGain, aplicar la ganancia de respaldo
    finalGainDb = preampWithoutRG;
  }

  // Escala lineal de potencia acústica: 10 ^ (dB / 20)
  let scale = Math.pow(10, finalGainDb / 20);

  // Evitar distorsión digital (Anti-Clipping) si está habilitado y se conoce el valor de pico
  if (preventClipping && peak && peak > 0) {
    const maxSafeScale = 1.0 / peak;
    if (scale > maxSafeScale) {
      scale = maxSafeScale;
    }
  }

  // Limitar al rango de volumen válido para el reproductor (0.0 a 1.0)
  return Math.max(0.0, Math.min(1.0, scale));
}

/**
 * Aplica el volumen calculado por ReplayGain a la pista activa actual y actualiza la línea base de fundido cruzado.
 */
export function applyReplayGainToPlayer(track, settings = DEFAULT_REPLAYGAIN_SETTINGS) {
  const targetMultiplier = calculateTrackVolumeMultiplier(track, settings);
  setActiveBaselineVolume(targetMultiplier);
  return targetMultiplier;
}
