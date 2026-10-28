/**
 * Servicio de Letras para la versión Web de Vulpis.
 * Consulta la API pública de LRCLIB (lrclib.net) y parsea el formato .lrc
 * sin dependencias de sistemas de archivos nativos.
 */

const LYRICS_CACHE_KEY = 'vulpis_web_lyrics_cache';

/**
 * Parsea el formato LRC en un arreglo de { time: number | null, text: string, isBreak: boolean }.
 */
export function parseWebLrcLyrics(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== 'string') return [];
  const lines = rawLyrics.split('\n');
  const result = [];
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const metaRegex = /^\[(ar|ti|al|by|length|re|ve):.*\]$/i;

  let globalOffset = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const offsetMatch = trimmed.match(/^\[offset:\s*([+-]?\d+)\s*\]$/i);
    if (offsetMatch) {
      globalOffset = (parseInt(offsetMatch[1], 10) || 0) / 1000;
      break;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || metaRegex.test(trimmed) || /^\[offset:.*\]$/i.test(trimmed)) {
      continue;
    }

    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();

    if (matches.length > 0) {
      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
        let timeInSeconds = min * 60 + sec + ms / 1000;
        if (globalOffset !== 0) {
          timeInSeconds = Math.max(0, timeInSeconds + globalOffset);
        }
        if (text) {
          result.push({ time: timeInSeconds, text, isBreak: false });
        } else {
          result.push({ time: timeInSeconds, text: '♪  ♪  ♪', isBreak: true });
        }
      }
    } else if (trimmed) {
      result.push({ time: null, text: trimmed, isBreak: false });
    }
  }

  result.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });

  return result;
}

/**
 * Consulta la API de LRCLIB para obtener letras sincronizadas o normales.
 */
export async function fetchWebLyrics(title, artist = '', album = '', duration = 0) {
  if (!title) return null;

  // 1. Revisar caché local en localStorage
  const cacheKey = `${title.toLowerCase().trim()}_${(artist || '').toLowerCase().trim()}`;
  if (typeof window !== 'undefined') {
    try {
      const rawCache = localStorage.getItem(LYRICS_CACHE_KEY);
      if (rawCache) {
        const cache = JSON.parse(rawCache);
        if (cache[cacheKey]) {
          return cache[cacheKey];
        }
      }
    } catch (_) {}
  }

  // 2. Consulta a LRCLIB /api/get
  try {
    const params = new URLSearchParams();
    params.set('track_name', title);
    if (artist && artist !== 'Google Drive') params.set('artist_name', artist);
    if (album && album !== 'Nube Privada') params.set('album_name', album);
    if (duration > 0) params.set('duration', Math.round(duration).toString());

    let res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { 'User-Agent': 'Vulpis-Web/1.0' },
    });

    if (res.ok) {
      const data = await res.json();
      const lyricData = {
        synced: data.syncedLyrics || null,
        plain: data.plainLyrics || null,
        parsed: data.syncedLyrics ? parseWebLrcLyrics(data.syncedLyrics) : null,
      };

      // Guardar en caché
      if (typeof window !== 'undefined') {
        try {
          const rawCache = localStorage.getItem(LYRICS_CACHE_KEY) || '{}';
          const cache = JSON.parse(rawCache);
          cache[cacheKey] = lyricData;
          localStorage.setItem(LYRICS_CACHE_KEY, JSON.stringify(cache));
        } catch (_) {}
      }

      return lyricData;
    }

    // 3. Si no hay coincidencia exacta, probar búsqueda /api/search
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title + (artist && artist !== 'Google Drive' ? ' ' + artist : ''))}`;
    res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Vulpis-Web/1.0' },
    });

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const best = results[0];
        const lyricData = {
          synced: best.syncedLyrics || null,
          plain: best.plainLyrics || null,
          parsed: best.syncedLyrics ? parseWebLrcLyrics(best.syncedLyrics) : null,
        };
        return lyricData;
      }
    }
  } catch (err) {
    console.warn('[WebLyrics] Error al consultar LRCLIB:', err);
  }

  return null;
}
