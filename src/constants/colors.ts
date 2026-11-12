/**
 * =============================================================================
 * Tokens de diseño — Paleta de colores de Vulpis
 * =============================================================================
 *
 * Este archivo es la fuente única de verdad para todos los colores de la app.
 * Cualquier valor de color en src/styles/ debe referenciar un token de aquí.
 */

export const Colors = {
  // FONDO
  bgBase:        '#090A0F',
  bgModal:       '#0F1017',
  bgSecondary:   '#0C0D14',
  bgDeep:        '#10111A',
  bgCard:        '#161722',
  bgSurface:     '#1A1C29',
  bgInput:       '#1E202E',
  bgPlaceholder: '#1E1B2E',
  bgMid:         '#232433',
  bgElevated:    '#2A2B3D',
  bgDragging:    '#201D33',
  bgFavoriteCard:'#18141F',

  // ACENTO
  accent:        '#8B5CF6',
  accentLight:   '#A78BFA',
  accentAlpha05: 'rgba(139, 92, 246, 0.05)',
  accentAlpha06: 'rgba(139, 92, 246, 0.06)',
  accentAlpha08: 'rgba(139, 92, 246, 0.08)',
  accentAlpha10: 'rgba(139, 92, 246, 0.10)',
  accentAlpha12: 'rgba(139, 92, 246, 0.12)',
  accentAlpha14: 'rgba(139, 92, 246, 0.14)',
  accentAlpha15: 'rgba(139, 92, 246, 0.15)',
  accentAlpha16: 'rgba(139, 92, 246, 0.16)',
  accentAlpha18: 'rgba(139, 92, 246, 0.18)',
  accentAlpha20: 'rgba(139, 92, 246, 0.20)',
  accentAlpha25: 'rgba(139, 92, 246, 0.25)',
  accentAlpha30: 'rgba(139, 92, 246, 0.30)',
  accentAlpha35: 'rgba(139, 92, 246, 0.35)',
  accentAlpha50: 'rgba(139, 92, 246, 0.50)',
  accentLightAlpha30: 'rgba(167, 139, 250, 0.30)',
  accentLightAlpha60: 'rgba(167, 139, 250, 0.60)',
  accentLightAlpha80: 'rgba(167, 139, 250, 0.80)',

  // TEXTO
  textPrimary:   '#FFFFFF',
  textSecondary: '#E2E3E9',
  textTertiary:  '#8E8F9E',
  textMuted:     '#5F6070',
  textDisabled:  '#4B4D63',
  textVersion:   '#3F4052',
  textLabel:     '#E2E8F0',
  textSubLabel:  '#94A3B8',
  textDropdown:  '#C3C5D4',
  textDesc:      '#64748B',
  textPrev:      '#A0A1B0',
  textPrevLabel: '#6B6C80',
  textWhiteAlpha28: 'rgba(255, 255, 255, 0.28)',
  textWhiteAlpha48: 'rgba(255, 255, 255, 0.48)',
  textWhiteAlpha75: 'rgba(255, 255, 255, 0.75)',

  // BORDE
  borderCard:    '#2C2D3C',
  borderSubtle:  '#1F202E',
  borderDivider: '#1A1C29',
  borderList:    '#26273B',
  borderMuted:   '#3E4059',
  borderSlate:   '#475569',
  borderWhiteAlpha02: 'rgba(255, 255, 255, 0.02)',
  borderWhiteAlpha03: 'rgba(255, 255, 255, 0.03)',
  borderWhiteAlpha04: 'rgba(255, 255, 255, 0.04)',
  borderWhiteAlpha05: 'rgba(255, 255, 255, 0.05)',
  borderWhiteAlpha06: 'rgba(255, 255, 255, 0.06)',
  borderWhiteAlpha08: 'rgba(255, 255, 255, 0.08)',
  borderSurfaceAlpha60: 'rgba(44, 45, 60, 0.60)',

  // PELIGRO
  danger:          '#EF4444',
  dangerLight:     '#F87171',
  dangerAlpha08:   'rgba(239, 68, 68, 0.08)',
  dangerAlpha12:   'rgba(239, 68, 68, 0.12)',
  dangerAlpha15:   'rgba(239, 68, 68, 0.15)',
  dangerAlpha20:   'rgba(239, 68, 68, 0.20)',
  dangerAlpha25:   'rgba(239, 68, 68, 0.25)',
  dangerAlpha30:   'rgba(239, 68, 68, 0.30)',

  // ADVERTENCIA
  warning:         '#F59E0B',
  warningAlpha08:  'rgba(245, 158, 11, 0.08)',
  warningAlpha20:  'rgba(245, 158, 11, 0.20)',

  // OVERLAY
  overlayBlack:    '#000000',
  overlayAlpha70:  'rgba(0, 0, 0, 0.70)',
  overlayAlpha75:  'rgba(0, 0, 0, 0.75)',
  overlayAlpha78:  'rgba(0, 0, 0, 0.78)',
  overlayAlpha80:  'rgba(0, 0, 0, 0.80)',
  overlayBgAlpha75: 'rgba(9, 10, 15, 0.75)',
  overlaySurfaceAlpha60: 'rgba(22, 23, 34, 0.60)',
  overlayModalAlpha80: 'rgba(31, 32, 46, 0.80)',

  // SUPERFICIES SEMITRANSPARENTES
  surfaceWhiteAlpha02:  'rgba(255, 255, 255, 0.02)',
  surfaceWhiteAlpha03:  'rgba(255, 255, 255, 0.03)',
  surfaceWhiteAlpha04:  'rgba(255, 255, 255, 0.04)',
  surfaceWhiteAlpha05:  'rgba(255, 255, 255, 0.05)',
  surfaceWhiteAlpha06:  'rgba(255, 255, 255, 0.06)',
  surfaceWhiteAlpha08:  'rgba(255, 255, 255, 0.08)',
  surfaceWhiteAlpha20:  'rgba(255, 255, 255, 0.20)',

  // TEXTO ESTÁTICO
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof Colors;
export default Colors;
