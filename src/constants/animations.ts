/**
 * animations.ts — Tokens de animación globales de Vulpis
 *
 * Todas las duraciones, curvas y configs de spring se definen aquí para que
 * cada superficie de la app tenga el mismo lenguaje visual de movimiento.
 *
 * Inspirado en el sistema de Spotify/Material Motion:
 *  - Entradas:  más rápidas y con resorte (se percibe como ágil)
 *  - Salidas:   más lentas y con easing out (se percibe como suave)
 *  - Micro-interacciones: 100-150ms (hover, press)
 */

export interface SpringConfig {
  tension: number;
  friction: number;
}

// ─── Duraciones ──────────────────────────────────────────────────────────────
export const DURATION = {
  micro:  120,   // Press feedback, highlight
  fast:   200,   // Salida rápida
  normal: 280,   // Sheet entrada / fade de fondo
  slow:   400,   // Transiciones de página
  color:  800,   // Transición de color de fondo del player
} as const;

export type DurationKey = keyof typeof DURATION;

// ─── Configuraciones de Spring ────────────────────────────────────────────────
export const SPRING: Record<'gentle' | 'bouncy' | 'stiff', SpringConfig> = {
  /** Rebote suave — sheets, drawer */
  gentle: { tension: 65, friction: 11 },
  /** Rebote medio — fab, botones flotantes */
  bouncy: { tension: 80, friction: 9 },
  /** Sin rebote — modales y overlays */
  stiff:  { tension: 120, friction: 18 },
};

// ─── Configuraciones de Easing personalizadas ────────────────────────────────
export const EASING_OUT = 'easeOut' as const;   // Para salidas
export const EASING_IN  = 'easeIn' as const;    // Para entradas

// ─── Opacity presets ─────────────────────────────────────────────────────────
export const BACKDROP_OPACITY = 0.65; // Backdrop del drawer / sheets

// ─── Traducciones de entrada (para sheets y drawers) ─────────────────────────
export const SHEET_TRANSLATE_Y_HIDDEN = 600; // Fuera de pantalla hacia abajo
export const DRAWER_TRANSLATE_X_HIDDEN = -290; // Fuera de pantalla hacia la izquierda
