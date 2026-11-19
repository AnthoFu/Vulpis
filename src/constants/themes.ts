/**
 * =============================================================================
 * Constantes y Definiciones de Temas Visuales — Vulpis
 * =============================================================================
 *
 * Contiene las paletas de colores predefinidas para los temas de la aplicación:
 * - Violeta Vulpis (Default)
 * - AMOLED Black (Ahorro de batería para pantallas OLED)
 * - Cyberpunk (Cian eléctrico y atmósfera neón)
 * - Esmeralda (Verde bosque premium)
 * - Dinámico (Se adapta al color predominante de la pista activa)
 */

import { ThemeDefinition, ThemeId, ThemePalette } from '../models/Theme';

/**
 * Convierte un color HEX (#RRGGBB) a formato rgba(R, G, B, alpha).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) {
    return `rgba(139, 92, 246, ${alpha})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Paleta base: Violeta Vulpis (Firma del reproductor)
 */
export const VULPIS_VIOLET_PALETTE: ThemePalette = {
  bgBase: '#090A0F',
  bgModal: '#0F1017',
  bgSecondary: '#0C0D14',
  bgDeep: '#10111A',
  bgCard: '#161722',
  bgSurface: '#1A1C29',
  bgInput: '#1E202E',
  bgElevated: '#2A2B3D',

  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentAlpha10: 'rgba(139, 92, 246, 0.10)',
  accentAlpha15: 'rgba(139, 92, 246, 0.15)',
  accentAlpha20: 'rgba(139, 92, 246, 0.20)',
  accentAlpha30: 'rgba(139, 92, 246, 0.30)',

  borderCard: '#2C2D3C',
  borderSubtle: '#1F202E',
  borderDivider: '#1A1C29',

  textPrimary: '#FFFFFF',
  textSecondary: '#E2E3E9',
  textTertiary: '#8E8F9E',
  textMuted: '#5F6070',
};

/**
 * Paleta AMOLED Black: Negros puros (#000000) para pantallas OLED.
 */
export const AMOLED_BLACK_PALETTE: ThemePalette = {
  bgBase: '#000000',
  bgModal: '#050505',
  bgSecondary: '#020202',
  bgDeep: '#050505',
  bgCard: '#0A0A0A',
  bgSurface: '#121212',
  bgInput: '#151515',
  bgElevated: '#1C1C1C',

  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentAlpha10: 'rgba(139, 92, 246, 0.10)',
  accentAlpha15: 'rgba(139, 92, 246, 0.15)',
  accentAlpha20: 'rgba(139, 92, 246, 0.20)',
  accentAlpha30: 'rgba(139, 92, 246, 0.30)',

  borderCard: '#1C1C1C',
  borderSubtle: '#121212',
  borderDivider: '#0D0D0D',

  textPrimary: '#FFFFFF',
  textSecondary: '#EDEDED',
  textTertiary: '#9E9E9E',
  textMuted: '#616161',
};

/**
 * Paleta Cyberpunk: Cian eléctrico futurista y tonos azul noche.
 */
export const CYBERPUNK_PALETTE: ThemePalette = {
  bgBase: '#06070E',
  bgModal: '#0A0C16',
  bgSecondary: '#05060B',
  bgDeep: '#080A12',
  bgCard: '#0E1120',
  bgSurface: '#15192E',
  bgInput: '#1C213D',
  bgElevated: '#252B4E',

  accent: '#00F0FF',
  accentLight: '#70F6FF',
  accentAlpha10: 'rgba(0, 240, 255, 0.10)',
  accentAlpha15: 'rgba(0, 240, 255, 0.15)',
  accentAlpha20: 'rgba(0, 240, 255, 0.20)',
  accentAlpha30: 'rgba(0, 240, 255, 0.30)',

  borderCard: '#222849',
  borderSubtle: '#171B33',
  borderDivider: '#121528',

  textPrimary: '#FFFFFF',
  textSecondary: '#E0F7FA',
  textTertiary: '#7E91A8',
  textMuted: '#4D5B6D',
};

/**
 * Paleta Esmeralda: Verde menta / esmeralda de alto contraste.
 */
export const EMERALD_PALETTE: ThemePalette = {
  bgBase: '#050B08',
  bgModal: '#08120D',
  bgSecondary: '#040907',
  bgDeep: '#060E0A',
  bgCard: '#0C1C14',
  bgSurface: '#12261C',
  bgInput: '#183225',
  bgElevated: '#204232',

  accent: '#10B981',
  accentLight: '#34D399',
  accentAlpha10: 'rgba(16, 185, 129, 0.10)',
  accentAlpha15: 'rgba(16, 185, 129, 0.15)',
  accentAlpha20: 'rgba(16, 185, 129, 0.20)',
  accentAlpha30: 'rgba(16, 185, 129, 0.30)',

  borderCard: '#1D3D2F',
  borderSubtle: '#142E23',
  borderDivider: '#0F241B',

  textPrimary: '#FFFFFF',
  textSecondary: '#D1FAE5',
  textTertiary: '#76A38F',
  textMuted: '#4B6B5D',
};

/**
 * Genera una paleta adaptativa en base al color predominante extraído de la carátula.
 */
export function buildDynamicPalette(primaryHex: string): ThemePalette {
  const accent = primaryHex && primaryHex.startsWith('#') && primaryHex.length === 7
    ? primaryHex
    : '#8B5CF6';

  return {
    bgBase: '#08080E',
    bgModal: '#0E0E18',
    bgSecondary: '#0A0A12',
    bgDeep: '#0C0C14',
    bgCard: '#141422',
    bgSurface: '#1A1A2C',
    bgInput: '#202035',
    bgElevated: '#2B2B44',

    accent: accent,
    accentLight: accent,
    accentAlpha10: hexToRgba(accent, 0.10),
    accentAlpha15: hexToRgba(accent, 0.15),
    accentAlpha20: hexToRgba(accent, 0.20),
    accentAlpha30: hexToRgba(accent, 0.30),

    borderCard: '#27273C',
    borderSubtle: '#1C1C2D',
    borderDivider: '#161624',

    textPrimary: '#FFFFFF',
    textSecondary: '#EAEBF0',
    textTertiary: '#9A9BAE',
    textMuted: '#67687C',
  };
}

/**
 * Catálogo de todos los temas visuales disponibles en Vulpis.
 */
export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'vulpis-violet': {
    id: 'vulpis-violet',
    name: 'Violeta Vulpis',
    description: 'Estilo original y firma de la app con acentos violetas profundos.',
    palette: VULPIS_VIOLET_PALETTE,
    preview: {
      base: '#090A0F',
      card: '#161722',
      accent: '#8B5CF6',
    },
  },
  'amoled-black': {
    id: 'amoled-black',
    name: 'AMOLED Black',
    description: 'Negro puro para máximo ahorro de batería en pantallas OLED.',
    palette: AMOLED_BLACK_PALETTE,
    preview: {
      base: '#000000',
      card: '#0A0A0A',
      accent: '#8B5CF6',
    },
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Estética futurista de alto impacto con cian eléctrico.',
    palette: CYBERPUNK_PALETTE,
    preview: {
      base: '#06070E',
      card: '#0E1120',
      accent: '#00F0FF',
    },
  },
  'emerald': {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Tonos verdes menta y naturaleza para una vibra relajante.',
    palette: EMERALD_PALETTE,
    preview: {
      base: '#050B08',
      card: '#0C1C14',
      accent: '#10B981',
    },
  },
  'dynamic': {
    id: 'dynamic',
    name: 'Tema Dinámico',
    description: 'Adapta los acentos de la app al color de la carátula en reproducción.',
    isDynamic: true,
    palette: VULPIS_VIOLET_PALETTE,
    preview: {
      base: '#08080E',
      card: '#141422',
      accent: '#E040FB',
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME_ID: ThemeId = 'vulpis-violet';
