/**
 * Modelo de datos y utilidades para las Pistas de Audio (Track) en Vulpis.
 */

/**
 * Datos de sonoridad y normalización ReplayGain asociados a una pista.
 */
export interface ReplayGainData {
  trackGain?: number | null;
  trackPeak?: number | null;
  albumGain?: number | null;
  albumPeak?: number | null;
}

/**
 * Modelo de dominio unificado para una Pista de Audio en Vulpis.
 * Compatible con la interfaz nativa de TrackPlayer (JSI) y las fuentes híbridas (Local, Drive).
 */
export interface Track {
  /** Identificador único y estable (ej: 'drive-1234', 'local-5678', 'imported-999') */
  mediaId: string;
  /** Ruta al archivo local ('file:///...') o endpoint de streaming remoto */
  url: string;
  /** Título de la canción */
  title: string;
  /** Nombre del artista o intérprete principal */
  artist: string;
  /** Nombre del álbum discográfico (opcional) */
  album?: string | null;
  /** Género musical normalizado (opcional) */
  genre?: string | null;
  /** URI a la carátula en caché o asset local. NUNCA debe ser una cadena base64 gigante */
  artworkUrl?: string | null;
  /** Letra sin procesar (texto plano o formato sincronizado .lrc) */
  lyrics?: string | null;
  /** Duración en segundos */
  duration?: number;
  /** Metadatos de ganancia acústica ReplayGain / SoundCheck */
  replayGain?: ReplayGainData | null;
  /** Cabeceras HTTP adicionales para streaming protegido (ej: Authorization Bearer) */
  headers?: Record<string, string>;
  /** Clave interna opcional usada para renderizado reactivo estable en listas drag & drop */
  queueId?: string;
}

/**
 * Crea una nueva instancia de Track garantizando valores predeterminados seguros.
 *
 * @param params Propiedades iniciales de la pista
 * @returns Instancia normalizada de Track
 */
export function createTrack(
  params: Partial<Track> & { mediaId: string; url: string; title: string; artist: string }
): Track {
  return {
    mediaId: params.mediaId,
    url: params.url,
    title: params.title.trim() || 'Pista Desconocida',
    artist: params.artist.trim() || 'Artista Desconocido',
    album: params.album ?? null,
    genre: params.genre ?? null,
    artworkUrl: sanitizeArtworkUrl(params.artworkUrl),
    lyrics: params.lyrics ?? null,
    duration: typeof params.duration === 'number' && !isNaN(params.duration) ? params.duration : 0,
    replayGain: params.replayGain ?? null,
    ...(params.headers ? { headers: params.headers } : {}),
    ...(params.queueId ? { queueId: params.queueId } : {}),
  };
}

/**
 * Sanitiza la URL de una carátula eliminando cadenas Base64 en línea (data:image/...)
 * para prevenir desbordes de memoria en SQLite CursorWindow (2MB) en Android.
 *
 * @param artworkUrl URL o cadena candidata
 * @returns URI segura en el sistema de archivos o null si era Base64
 */
export function sanitizeArtworkUrl(artworkUrl?: string | null): string | null {
  if (!artworkUrl || typeof artworkUrl !== 'string') return null;
  // Descartar cadenas en base64 directas
  if (artworkUrl.startsWith('data:') || artworkUrl.startsWith('data:image')) {
    return null;
  }
  return artworkUrl;
}

/**
 * Sanitiza una pista para almacenamiento seguro en AsyncStorage.
 * Elimina carátulas base64 y descarta propiedades temporales como cabeceras o sockets.
 *
 * @param track Pista a sanitizar
 * @returns Pista serializable o null si la entrada es inválida
 */
export function sanitizeTrackForStorage(track?: Partial<Track> | null): Track | null {
  if (!track || !track.mediaId || !track.url) return null;

  return {
    mediaId: track.mediaId,
    url: track.url,
    title: track.title || 'Pista Desconocida',
    artist: track.artist || 'Artista Desconocido',
    album: track.album ?? null,
    genre: track.genre ?? null,
    artworkUrl: sanitizeArtworkUrl(track.artworkUrl),
    lyrics: track.lyrics ?? null,
    duration: typeof track.duration === 'number' ? track.duration : 0,
    replayGain: track.replayGain ?? null,
  };
}

/**
 * Comprueba si una pista proviene de Google Drive.
 */
export function isDriveTrack(track?: Partial<Track> | null): boolean {
  return Boolean(track?.mediaId?.startsWith('drive-'));
}

/**
 * Comprueba si una pista está almacenada localmente en el dispositivo.
 */
export function isLocalTrack(track?: Partial<Track> | null): boolean {
  if (!track) return false;
  return Boolean(track.url?.startsWith('file://') || track.mediaId?.startsWith('local-'));
}
