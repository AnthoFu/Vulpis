/**
 * =============================================================================
 * Modelo de Dominio — Temas Visuales de Vulpis
 * =============================================================================
 *
 * Define los identificadores de temas, tokens de paleta adaptables y la estructura
 * de definición de temas visuales para la aplicación móvil y web.
 */

export type ThemeId =
  | 'vulpis-violet'
  | 'amoled-black'
  | 'cyberpunk'
  | 'emerald'
  | 'dynamic';

/**
 * Paleta de colores requerida para cualquier tema visual de Vulpis.
 */
export interface ThemePalette {
  // Fondos
  bgBase: string;
  bgModal: string;
  bgSecondary: string;
  bgDeep: string;
  bgCard: string;
  bgSurface: string;
  bgInput: string;
  bgElevated: string;

  // Acento y variantes con transparencia
  accent: string;
  accentLight: string;
  accentAlpha10: string;
  accentAlpha15: string;
  accentAlpha20: string;
  accentAlpha30: string;

  // Bordes
  borderCard: string;
  borderSubtle: string;
  borderDivider: string;

  // Texto
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
}

/**
 * Definición completa de un tema visual registrable en la aplicación.
 */
export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  isDynamic?: boolean;
  palette: ThemePalette;
  preview: {
    base: string;
    card: string;
    accent: string;
  };
}
