/**
 * Modelo de datos, bandas de frecuencia y presets del Ecualizador de Audio de Vulpis.
 */

export interface EqualizerBand {
  index: number;
  freq: number;
  label: string;
  gain: number; // En dB (-10 dB a +10 dB)
}

export type EqualizerPresetId =
  | 'flat'
  | 'bass_boost'
  | 'rock'
  | 'pop'
  | 'jazz'
  | 'classical'
  | 'dance'
  | 'vocal'
  | 'acoustic'
  | 'custom';

export interface EqualizerPreset {
  id: EqualizerPresetId;
  name: string;
  description: string;
  gains: [number, number, number, number, number]; // Ganancias para las 5 bandas (en dB)
  bassBoost: number; // Nivel de refuerzo de graves (0 a 10 dB)
}

/**
 * Bandas estándar para el ecualizador gráfico de 5 bandas.
 */
export const EQUALIZER_DEFAULT_BANDS: EqualizerBand[] = [
  { index: 0, freq: 60, label: '60 Hz', gain: 0 },
  { index: 1, freq: 230, label: '230 Hz', gain: 0 },
  { index: 2, freq: 910, label: '910 Hz', gain: 0 },
  { index: 3, freq: 3600, label: '3.6 kHz', gain: 0 },
  { index: 4, freq: 14000, label: '14 kHz', gain: 0 },
];

/**
 * Catálogo de presets acústicos calibrados para Vulpis.
 */
export const EQUALIZER_PRESETS: Record<EqualizerPresetId, EqualizerPreset> = {
  flat: {
    id: 'flat',
    name: 'Plano (Neutral)',
    description: 'Respuesta acústica original sin coloración.',
    gains: [0, 0, 0, 0, 0],
    bassBoost: 0,
  },
  bass_boost: {
    id: 'bass_boost',
    name: 'Refuerzo de Graves',
    description: 'Graves profundos y contundentes para beats e impacto acústico.',
    gains: [6, 4, 1, 0, 0],
    bassBoost: 6,
  },
  rock: {
    id: 'rock',
    name: 'Rock & Metal',
    description: 'Curva en V con bombos potentes y guitarras nítidas.',
    gains: [5, 3, -1, 2, 4],
    bassBoost: 3,
  },
  pop: {
    id: 'pop',
    name: 'Pop',
    description: 'Voces brillantes y presencia rítmica balanceada.',
    gains: [1, 3, 4, 2, -1],
    bassBoost: 1,
  },
  jazz: {
    id: 'jazz',
    name: 'Jazz & Blues',
    description: 'Sonido cálido y acústico, destacando contrabajos y metales.',
    gains: [3, 2, 1, 2, 3],
    bassBoost: 2,
  },
  classical: {
    id: 'classical',
    name: 'Clásica',
    description: 'Dinámica amplia para orquestas y cuerdas detalladas.',
    gains: [4, 2, -1, 2, 3],
    bassBoost: 0,
  },
  dance: {
    id: 'dance',
    name: 'Electrónica / Dance',
    description: 'Subgraves elevados y agudos cristalinos para club y sintetizadores.',
    gains: [6, 4, 0, 2, 4],
    bassBoost: 5,
  },
  vocal: {
    id: 'vocal',
    name: 'Vocal / Podcasts',
    description: 'Claridad en la palabra hablada y atenuación de frecuencias graves.',
    gains: [-2, 1, 4, 3, 0],
    bassBoost: 0,
  },
  acoustic: {
    id: 'acoustic',
    name: 'Acústica',
    description: 'Claridad natural para guitarras de cuerda y percusión sutil.',
    gains: [3, 2, 1, 2, 2],
    bassBoost: 1,
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Ajuste manual individual de cada frecuencia.',
    gains: [0, 0, 0, 0, 0],
    bassBoost: 0,
  },
};

/**
 * Configuración persistente del ecualizador.
 */
export interface EqualizerSettings {
  /** Activa o desactiva la aplicación del ecualizador */
  enabled: boolean;
  /** Identificador del preset seleccionado */
  presetId: EqualizerPresetId;
  /** Bandas de frecuencia activas y sus ganancias en dB */
  bands: EqualizerBand[];
  /** Nivel de refuerzo de graves en dB (0 a 10 dB) */
  bassBoost: number;
}

/**
 * Configuración predeterminada del ecualizador.
 */
export const DEFAULT_EQUALIZER_SETTINGS: EqualizerSettings = {
  enabled: false,
  presetId: 'flat',
  bands: EQUALIZER_DEFAULT_BANDS,
  bassBoost: 0,
};
