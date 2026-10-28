/**
 * Barrel export centralizado para la capa de servicios de Vulpis.
 * Agrupa los adaptadores externos de infraestructura (APIs, I/O, FileSystem y autenticación).
 */

// Servicios de Google Drive (API, OAuth 2.0 PKCE y Descargas)
export * from './drive';

// Servicios de Letras en Línea (LRCLIB y Fallbacks)
export * from './lyrics/lyricsService';

// Servicios de Escaneo Multimedia del Dispositivo
export * from './scanner/mediaScanner';
