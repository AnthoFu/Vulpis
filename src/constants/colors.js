/**
 * =============================================================================
 * Tokens de diseño — Paleta de colores de Vulpis
 * =============================================================================
 *
 * Este archivo es la fuente única de verdad para todos los colores de la app.
 * Cualquier valor de color en src/styles/ debe referenciar un token de aquí.
 *
 * Grupos:
 *   FONDO     — Capas de fondo oscuro (de más oscuro a más claro)
 *   SUPERFICIE — Tarjetas, contenedores elevados, drawers
 *   ACENTO    — Violeta Vulpis: color de marca, interacciones activas
 *   TEXTO     — Jerarquía tipográfica
 *   BORDE     — Separadores y contornos
 *   PELIGRO   — Acciones destructivas (rojo)
 *   ADVERTENCIA — Alertas (ámbar)
 *   OVERLAY   — Fondos semitransparentes para modales y backdrops
 * =============================================================================
 */

export const Colors = {

  // ---------------------------------------------------------------------------
  // FONDO — de más oscuro a más claro
  // ---------------------------------------------------------------------------
  /** Fondo base de la app, el más oscuro */
  bgBase:        '#090A0F',
  /** Fondo de modales y drawers */
  bgModal:       '#0F1017',
  /** Fondo secundario ligeramente más claro */
  bgSecondary:   '#0C0D14',
  /** Fondo de capas intermedias */
  bgDeep:        '#10111A',
  /** Fondo estándar de tarjetas y componentes elevados */
  bgCard:        '#161722',
  /** Fondo de superficie secundaria */
  bgSurface:     '#1A1C29',
  /** Fondo de ítems de lista o inputs */
  bgInput:       '#1E202E',
  /** Fondo sutil para íconos y placeholders */
  bgPlaceholder: '#1E1B2E',
  /** Fondo medio para separadores internos */
  bgMid:         '#232433',
  /** Fondo de ítems activos leves */
  bgElevated:    '#2A2B3D',
  /** Fondo de ítem al arrastrar en la cola */
  bgDragging:    '#201D33',
  /** Fondo sutil de tarjeta de playlist favorita */
  bgFavoriteCard:'#18141F',

  // ---------------------------------------------------------------------------
  // ACENTO — Violeta Vulpis
  // ---------------------------------------------------------------------------
  /** Color de acento principal */
  accent:       '#8B5CF6',
  /** Variante clara del acento (hover, texto activo) */
  accentLight:  '#A78BFA',

  /** Acento con opacidad 5% — fondo muy sutil */
  accentAlpha05: 'rgba(139, 92, 246, 0.05)',
  /** Acento con opacidad 6% */
  accentAlpha06: 'rgba(139, 92, 246, 0.06)',
  /** Acento con opacidad 8% — fondo de badges y chips */
  accentAlpha08: 'rgba(139, 92, 246, 0.08)',
  /** Acento con opacidad 10% */
  accentAlpha10: 'rgba(139, 92, 246, 0.10)',
  /** Acento con opacidad 12% — fondo de botones secundarios */
  accentAlpha12: 'rgba(139, 92, 246, 0.12)',
  /** Acento con opacidad 14% */
  accentAlpha14: 'rgba(139, 92, 246, 0.14)',
  /** Acento con opacidad 15% — pills, opciones seleccionadas */
  accentAlpha15: 'rgba(139, 92, 246, 0.15)',
  /** Acento con opacidad 16% — lírica activa */
  accentAlpha16: 'rgba(139, 92, 246, 0.16)',
  /** Acento con opacidad 18% — footer button activo */
  accentAlpha18: 'rgba(139, 92, 246, 0.18)',
  /** Acento con opacidad 20% — badges sincronizados */
  accentAlpha20: 'rgba(139, 92, 246, 0.20)',
  /** Acento con opacidad 25% — íconos seleccionados */
  accentAlpha25: 'rgba(139, 92, 246, 0.25)',
  /** Acento con opacidad 30% */
  accentAlpha30: 'rgba(139, 92, 246, 0.30)',
  /** Acento con opacidad 35% */
  accentAlpha35: 'rgba(139, 92, 246, 0.35)',
  /** Acento con opacidad 50% — borde de botón activo */
  accentAlpha50: 'rgba(139, 92, 246, 0.50)',

  /** Acento claro con opacidad 30% — borde de badge sincronizado */
  accentLightAlpha30: 'rgba(167, 139, 250, 0.30)',
  /** Acento claro con opacidad 60% — pausa entre líneas de letra */
  accentLightAlpha60: 'rgba(167, 139, 250, 0.60)',
  /** Acento claro con opacidad 80% — text shadow lírica activa */
  accentLightAlpha80: 'rgba(167, 139, 250, 0.80)',

  // ---------------------------------------------------------------------------
  // TEXTO — jerarquía tipográfica
  // ---------------------------------------------------------------------------
  /** Texto primario, títulos */
  textPrimary:   '#FFFFFF',
  /** Texto secundario, subtítulos */
  textSecondary: '#E2E3E9',
  /** Texto terciario, descripciones */
  textTertiary:  '#8E8F9E',
  /** Texto muted — placeholders, etiquetas de sección */
  textMuted:     '#5F6070',
  /** Texto deshabilitado / muy bajo contraste */
  textDisabled:  '#4B4D63',
  /** Texto de versión / monospace sutil */
  textVersion:   '#3F4052',

  /** Texto para labels de settings (slate-300) */
  textLabel:    '#E2E8F0',
  /** Texto para subtítulos de settings (slate-400) */
  textSubLabel: '#94A3B8',
  /** Texto secundario para elementos de búsqueda desplegable */
  textDropdown: '#C3C5D4',
  /** Texto para descripciones de settings (slate-500) */
  textDesc:     '#64748B',
  /** Texto para textos históricos / anteriores */
  textPrev:     '#A0A1B0',
  /** Texto para encabezados de sección histórica */
  textPrevLabel: '#6B6C80',

  /** Texto blanco con opacidad 28% — línea de letra no activa */
  textWhiteAlpha28: 'rgba(255, 255, 255, 0.28)',
  /** Texto blanco con opacidad 48% — línea de letra pasada */
  textWhiteAlpha48: 'rgba(255, 255, 255, 0.48)',
  /** Texto blanco con opacidad 75% — lyric live preview */
  textWhiteAlpha75: 'rgba(255, 255, 255, 0.75)',

  // ---------------------------------------------------------------------------
  // BORDE — contornos y separadores
  // ---------------------------------------------------------------------------
  /** Borde estándar de tarjetas */
  borderCard:    '#2C2D3C',
  /** Borde más sutil */
  borderSubtle:  '#1F202E',
  /** Borde de separador/divider */
  borderDivider: '#1A1C29',
  /** Borde de ítems de lista */
  borderList:    '#26273B',
  /** Borde muted para handles e ítems previos */
  borderMuted:   '#3E4059',
  /** Borde slate para radio buttons */
  borderSlate:   '#475569',

  /** Borde blanco con opacidad 2% */
  borderWhiteAlpha02: 'rgba(255, 255, 255, 0.02)',
  /** Borde blanco con opacidad 3% — ítems históricos */
  borderWhiteAlpha03: 'rgba(255, 255, 255, 0.03)',
  /** Borde blanco con opacidad 4% — rows de álbumes/artistas */
  borderWhiteAlpha04: 'rgba(255, 255, 255, 0.04)',
  /** Borde blanco con opacidad 5% */
  borderWhiteAlpha05: 'rgba(255, 255, 255, 0.05)',
  /** Borde blanco con opacidad 6% — divisores de sección */
  borderWhiteAlpha06: 'rgba(255, 255, 255, 0.06)',
  /** Borde blanco con opacidad 8% — contorno de bottom sheet */
  borderWhiteAlpha08: 'rgba(255, 255, 255, 0.08)',

  /** Borde de superficie semitransparente */
  borderSurfaceAlpha60: 'rgba(44, 45, 60, 0.60)',

  // ---------------------------------------------------------------------------
  // PELIGRO — acciones destructivas
  // ---------------------------------------------------------------------------
  /** Color de peligro principal */
  danger:          '#EF4444',
  /** Texto de peligro más suave */
  dangerLight:     '#F87171',

  /** Peligro con opacidad 8% — fondo de botón destructivo */
  dangerAlpha08:   'rgba(239, 68, 68, 0.08)',
  /** Peligro con opacidad 12% — fondo de botón limpiar cola */
  dangerAlpha12:   'rgba(239, 68, 68, 0.12)',
  /** Peligro con opacidad 15% */
  dangerAlpha15:   'rgba(239, 68, 68, 0.15)',
  /** Peligro con opacidad 20% */
  dangerAlpha20:   'rgba(239, 68, 68, 0.20)',
  /** Peligro con opacidad 25% */
  dangerAlpha25:   'rgba(239, 68, 68, 0.25)',
  /** Peligro con opacidad 30% */
  dangerAlpha30:   'rgba(239, 68, 68, 0.30)',

  // ---------------------------------------------------------------------------
  // ADVERTENCIA — alertas (ámbar)
  // ---------------------------------------------------------------------------
  /** Color de advertencia principal */
  warning:         '#F59E0B',
  /** Advertencia con opacidad 8% */
  warningAlpha08:  'rgba(245, 158, 11, 0.08)',
  /** Advertencia con opacidad 20% */
  warningAlpha20:  'rgba(245, 158, 11, 0.20)',

  // ---------------------------------------------------------------------------
  // OVERLAY — fondos de modales y backdrops
  // ---------------------------------------------------------------------------
  /** Overlay negro puro (backdrops de drawers) */
  overlayBlack:    '#000000',
  /** Overlay con opacidad 70% */
  overlayAlpha70:  'rgba(0, 0, 0, 0.70)',
  /** Overlay con opacidad 75% */
  overlayAlpha75:  'rgba(0, 0, 0, 0.75)',
  /** Overlay con opacidad 78% */
  overlayAlpha78:  'rgba(0, 0, 0, 0.78)',
  /** Overlay con opacidad 80% */
  overlayAlpha80:  'rgba(0, 0, 0, 0.80)',

  /** Overlay de fondo oscuro con opacidad 75% (backdrop del QueueSheet) */
  overlayBgAlpha75: 'rgba(9, 10, 15, 0.75)',
  /** Overlay de superficie oscura con opacidad 60% (footer button inactivo) */
  overlaySurfaceAlpha60: 'rgba(22, 23, 34, 0.60)',
  /** Overlay de modal oscura con opacidad 80% (sidebar modal) */
  overlayModalAlpha80: 'rgba(31, 32, 46, 0.80)',

  // ---------------------------------------------------------------------------
  // SUPERFICIES SEMITRANSPARENTES — backgrounds con alpha para handle, chips
  // ---------------------------------------------------------------------------
  /** Superficie blanca con opacidad 2% — fondo de ítem histórico */
  surfaceWhiteAlpha02:  'rgba(255, 255, 255, 0.02)',
  /** Superficie blanca con opacidad 3% */
  surfaceWhiteAlpha03:  'rgba(255, 255, 255, 0.03)',
  /** Superficie blanca con opacidad 4% */
  surfaceWhiteAlpha04:  'rgba(255, 255, 255, 0.04)',
  /** Superficie blanca con opacidad 5% — ítem activo en cola */
  surfaceWhiteAlpha05:  'rgba(255, 255, 255, 0.05)',
  /** Superficie blanca con opacidad 6% — botón cerrar header */
  surfaceWhiteAlpha06:  'rgba(255, 255, 255, 0.06)',
  /** Superficie blanca con opacidad 8% — badge de conteo de tabs / borde lyricsSheet */
  surfaceWhiteAlpha08:  'rgba(255, 255, 255, 0.08)',
  /** Superficie blanca con opacidad 20% — handle del bottom sheet */
  surfaceWhiteAlpha20:  'rgba(255, 255, 255, 0.20)',

  // ---------------------------------------------------------------------------
  // TEXTO ESTÁTICO
  // ---------------------------------------------------------------------------
  /** Blanco puro — texto sobre acento */
  white: '#FFFFFF',
  /** Negro puro */
  black: '#000',
};

export default Colors;
