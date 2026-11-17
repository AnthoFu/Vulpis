import { Playlist } from '../models/Playlist';
import { Track, sanitizeTrackForStorage } from '../models/Track';

/**
 * Sanitiza el nombre de una lista de reproducción para usarlo como nombre de archivo seguro.
 */
export function sanitizeFileName(name: string): string {
  if (!name || typeof name !== 'string') return 'playlist';
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

/**
 * Serializa una Playlist a formato JSON estructurado con metadatos de Vulpis.
 */
export function exportPlaylistToJson(playlist: Playlist): string {
  const payload = {
    vulpisVersion: '1.0',
    type: 'playlist',
    exportedAt: Date.now(),
    playlist: {
      id: playlist.id,
      name: playlist.name,
      createdAt: playlist.createdAt || Date.now(),
      trackCount: playlist.tracks?.length || 0,
      tracks: (playlist.tracks || []).map((t) => ({
        mediaId: t.mediaId,
        title: t.title || 'Sin Título',
        artist: t.artist || 'Artista Desconocido',
        album: t.album || '',
        duration: t.duration || 0,
        url: t.url || '',
        artworkUrl: t.artworkUrl || null,
        genre: t.genre || null,
      })),
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Serializa una Playlist a formato Extended M3U (#EXTM3U).
 * Estándar universal soportado por reproductores como VLC, Winamp, Foobar2000, etc.
 */
export function exportPlaylistToM3u(playlist: Playlist): string {
  const lines: string[] = [];

  lines.push('#EXTM3U');
  lines.push(`#PLAYLIST:${playlist.name || 'Vulpis Playlist'}`);

  for (const track of playlist.tracks || []) {
    const duration = Math.round(track.duration || 0);
    const artist = track.artist || 'Artista Desconocido';
    const title = track.title || 'Sin Título';
    const url = track.url || '';

    // Directiva extendida de metadatos: #EXTINF:<duración en seg>,<artista> - <título>
    lines.push(`#EXTINF:${duration},${artist} - ${title}`);
    lines.push(url);
  }

  return lines.join('\n');
}

/**
 * Parsea una cadena de texto en formato JSON y extrae el nombre y la colección de pistas.
 */
export function parsePlaylistFromJson(jsonString: string): { name: string; tracks: Track[] } | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;

    let name = 'Playlist Importada';
    let rawTracks: any[] = [];

    // Caso 1: Estructura oficial exportada por Vulpis
    if (parsed.playlist && typeof parsed.playlist === 'object') {
      name = parsed.playlist.name || name;
      rawTracks = Array.isArray(parsed.playlist.tracks) ? parsed.playlist.tracks : [];
    } else if (Array.isArray(parsed.tracks)) {
      // Caso 2: Estructura genérica { name, tracks }
      name = parsed.name || name;
      rawTracks = parsed.tracks;
    } else if (Array.isArray(parsed)) {
      // Caso 3: Array directo de pistas
      rawTracks = parsed;
    } else {
      return null;
    }

    const sanitizedTracks = rawTracks
      .map((t, idx): Track | null => {
        if (!t || typeof t !== 'object') return null;
        const mediaId = t.mediaId || `imported-json-${Date.now()}-${idx}`;
        const title = t.title || 'Sin Título';
        const artist = t.artist || 'Artista Desconocido';
        const url = t.url || '';

        return sanitizeTrackForStorage({
          mediaId,
          title,
          artist,
          album: t.album || '',
          duration: typeof t.duration === 'number' ? t.duration : 0,
          url,
          artworkUrl: t.artworkUrl || null,
          genre: t.genre || null,
        });
      })
      .filter((t): t is Track => t !== null);

    return {
      name: name.trim() || 'Playlist Importada',
      tracks: sanitizedTracks,
    };
  } catch (err) {
    console.warn('[PlaylistIO] Error al parsear JSON de playlist:', err);
    return null;
  }
}

/**
 * Parsea el contenido de un archivo M3U / M3U8 y extrae las pistas y el nombre de la lista.
 */
export function parsePlaylistFromM3u(
  content: string,
  fallbackName = 'Playlist Importada'
): { name: string; tracks: Track[] } | null {
  if (!content || typeof content !== 'string') return null;

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let playlistName = fallbackName;
  const tracks: Track[] = [];

  let pendingDuration = 0;
  let pendingTitle = '';
  let pendingArtist = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Etiqueta opcional de nombre de playlist: #PLAYLIST:<nombre>
    if (line.toUpperCase().startsWith('#PLAYLIST:')) {
      const extractedName = line.slice(10).trim();
      if (extractedName) {
        playlistName = extractedName;
      }
      continue;
    }

    // Directiva extendida de canción: #EXTINF:<duración>,<artista> - <título>
    if (line.toUpperCase().startsWith('#EXTINF:')) {
      const rest = line.slice(8).trim();
      const commaIdx = rest.indexOf(',');

      if (commaIdx !== -1) {
        const durStr = rest.slice(0, commaIdx).trim();
        const infoStr = rest.slice(commaIdx + 1).trim();

        const parsedDuration = parseInt(durStr, 10);
        pendingDuration = isNaN(parsedDuration) || parsedDuration < 0 ? 0 : parsedDuration;

        // Intentar separar "Artista - Título"
        const hyphenIdx = infoStr.indexOf(' - ');
        if (hyphenIdx !== -1) {
          pendingArtist = infoStr.slice(0, hyphenIdx).trim();
          pendingTitle = infoStr.slice(hyphenIdx + 3).trim();
        } else {
          pendingArtist = 'Artista Desconocido';
          pendingTitle = infoStr;
        }
      }
      continue;
    }

    // Si la línea es otro comentario que no sea #EXTINF, ignorarla
    if (line.startsWith('#')) {
      continue;
    }

    // Si llegamos a una línea sin '#' es la ruta o URL del archivo de audio
    const url = line;
    let title = pendingTitle;
    let artist = pendingArtist;

    // Si no había #EXTINF previo, inferir título desde el nombre del archivo
    if (!title) {
      const cleanUrl = url.split('?')[0];
      const filename = cleanUrl.split('/').pop() || 'Canción';
      const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '');
      const parts = nameWithoutExt.split(' - ');
      if (parts.length > 1) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        artist = 'Artista Desconocido';
        title = nameWithoutExt;
      }
    }

    const track: Track = {
      mediaId: `imported-m3u-${Date.now()}-${tracks.length}`,
      title: title || 'Sin Título',
      artist: artist || 'Artista Desconocido',
      duration: pendingDuration,
      url,
    };

    tracks.push(track);

    // Resetear variables para la siguiente entrada
    pendingDuration = 0;
    pendingTitle = '';
    pendingArtist = '';
  }

  if (tracks.length === 0) {
    return null;
  }

  return {
    name: playlistName,
    tracks,
  };
}
