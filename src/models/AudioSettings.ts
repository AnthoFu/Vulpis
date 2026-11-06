/**
 * Modelos de datos y configuraciones acústicas de Vulpis.
 */

/**
 * Modo de aplicación de ganancia en ReplayGain.
 * - 'track': Normaliza cada canción según su propia ganancia individual.
 * - 'album': Mantiene la dinámica y balance original entre canciones del mismo álbum.
 */
export type ReplayGainMode = 'track' | 'album';

/**
 * Opciones de configuración para la normalización de volumen ReplayGain.
 */
export interface ReplayGainSettings {
  /** Activa o desactiva la normalización automática */
  enabled: boolean;
  /** Modo de cálculo: por pista o por álbum */
  mode: ReplayGainMode;
  /** Pre-amplificación acústica en dB para pistas que poseen metadatos ReplayGain (-12 a +12 dB) */
  preampWithRG: number;
  /** Pre-amplificación acústica en dB para pistas sin metadatos ReplayGain (-12 a +12 dB) */
  preampWithoutRG: number;
  /** Limitador anti-saturación para prevenir distorsión digital si el pico excede 1.0 */
  preventClipping: boolean;
}

/**
 * Configuración predeterminada de ReplayGain.
 */
export const DEFAULT_REPLAYGAIN_SETTINGS: ReplayGainSettings = {
  enabled: false,
  mode: 'track',
  preampWithRG: 0,
  preampWithoutRG: -6,
  preventClipping: true,
};

/**
 * Opciones de configuración para las transiciones de Fundido Cruzado (Crossfade).
 */
export interface CrossfadeSettings {
  /** Activa o desactiva el fundido cruzado */
  enabled: boolean;
  /** Duración de la rampa de volumen en segundos (2 a 12s) */
  duration: number;
}

/**
 * Configuración predeterminada de Fundido Cruzado.
 */
export const DEFAULT_CROSSFADE_SETTINGS: CrossfadeSettings = {
  enabled: false,
  duration: 4,
};

/**
 * Opciones de configuración para el motor de letras y sincronización.
 */
export interface LyricsSettings {
  /** Activa o desactiva la consulta automática a APIs públicas (LRCLIB, etc.) */
  onlineLyricsEnabled: boolean;
  /** Umbral mínimo de similitud difusa (0.0 a 1.0) para aceptar una letra */
  matchThreshold: number;
  /** Si es true, prefiere la letra de la API pública sobre las etiquetas locales ID3 */
  preferOnlineOverID3: boolean;
}

/**
 * Configuración predeterminada de letras.
 */
export const DEFAULT_LYRICS_SETTINGS: LyricsSettings = {
  onlineLyricsEnabled: false,
  matchThreshold: 0.75,
  preferOnlineOverID3: true,
};
