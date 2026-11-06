import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cleanTitleOnly,
  calculateSimilarity,
  calculateTitleSimilarity,
} from '../../utils/fuzzyMatch';
import {
  LyricsSettings,
  DEFAULT_LYRICS_SETTINGS,
} from '../../models/AudioSettings';

const CACHE_KEY = 'vulpis_online_lyrics_cache';
const SETTINGS_KEY = 'vulpis_settings';
const CUSTOM_LYRICS_KEY = 'vulpis_custom_lyrics';

export const DEFAULT_SETTINGS = DEFAULT_LYRICS_SETTINGS;

const REQUEST_HEADERS = {
  'User-Agent': 'Vulpis-MusicPlayer/1.0.0 (https://github.com/AnthoFu/Vulpis)',
  Accept: 'application/json',
};

/**
 * Representación de un candidato de letra obtenido de APIs públicas.
 */
export interface LyricCandidate {
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

/**
 * Lee la letra personalizada guardada manualmente por el usuario.
 */
export async function getCustomLyrics(mediaId: string): Promise<string | null> {
  if (!mediaId) return null;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[mediaId] || null;
  } catch (e) {
    console.error('[LyricsService] Error leyendo letra personalizada:', e);
    return null;
  }
}

/**
 * Guarda o actualiza manualmente la letra personalizada de una canción.
 */
export async function saveCustomLyrics(mediaId: string, lyrics: string): Promise<void> {
  if (!mediaId) return;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[mediaId] = lyrics;
    await AsyncStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('[LyricsService] Error guardando letra personalizada:', e);
  }
}

/**
 * Elimina la letra personalizada para restaurar la letra por defecto.
 */
export async function removeCustomLyrics(mediaId: string): Promise<void> {
  if (!mediaId) return;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[mediaId];
    await AsyncStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('[LyricsService] Error eliminando letra personalizada:', e);
  }
}

/**
 * Carga la configuración de letras y preferencias desde AsyncStorage.
 */
export async function getSettings(): Promise<LyricsSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LYRICS_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('[LyricsService] Error leyendo ajustes:', e);
  }
  return DEFAULT_LYRICS_SETTINGS;
}

/**
 * Guarda los ajustes de letras en AsyncStorage.
 */
export async function saveSettings(newSettings: Partial<LyricsSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...newSettings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[LyricsService] Error guardando ajustes:', e);
  }
}

function getCacheKey(title: string, artist: string): string {
  const cleanT = cleanTitleOnly(title);
  const cleanA = cleanTitleOnly(artist);
  return `${cleanA}__${cleanT}`;
}

/**
 * Consulta la caché local persistente de letras.
 */
export async function getCachedLyrics(title: string, artist: string): Promise<string | null> {
  try {
    const rawCache = await AsyncStorage.getItem(CACHE_KEY);
    if (!rawCache) return null;
    const cache = JSON.parse(rawCache);
    const key = getCacheKey(title, artist);
    return cache[key] !== undefined ? cache[key] : null;
  } catch (e) {
    console.error('[LyricsService] Error leyendo caché de letras:', e);
    return null;
  }
}

/**
 * Guarda una letra en la caché persistente local de AsyncStorage.
 */
export async function setCachedLyrics(
  title: string,
  artist: string,
  lyrics: string
): Promise<void> {
  try {
    const rawCache = await AsyncStorage.getItem(CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};
    const key = getCacheKey(title, artist);
    cache[key] = lyrics;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('[LyricsService] Error guardando en caché de letras:', e);
  }
}

/**
 * Limpia la totalidad de las letras almacenadas en la caché local.
 */
export async function clearLyricsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error('[LyricsService] Error limpiando caché de letras:', e);
  }
}

/**
 * Consulta la API pública LRCLIB mediante estrategias progresivas.
 */
async function searchLrclib(cleanT: string, cleanA: string): Promise<LyricCandidate[]> {
  const queriesToTry: string[] = [];

  // 1. Título + Artista
  if (cleanA && cleanA !== 'desconocido' && cleanA !== 'artful') {
    queriesToTry.push(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanT} ${cleanA}`)}`);
  }

  // 2. Solo Título limpio
  queriesToTry.push(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanT)}`);

  // 3. Títulos con separadores 'x' o 'vs' (ej. Blade x Into The Void)
  if (cleanT.includes(' x ') || cleanT.includes(' vs ')) {
    const parts = cleanT.split(/\s+(?:x|vs)\s+/i);
    for (const part of parts) {
      if (part.trim().length > 3) {
        queriesToTry.push(`https://lrclib.net/api/search?q=${encodeURIComponent(part.trim())}`);
      }
    }
  }

  // 4. Búsqueda directa por track_name
  queriesToTry.push(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanT)}`);

  for (const url of queriesToTry) {
    try {
      console.log('[LyricsService] Petición LRCLIB:', url);
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items as LyricCandidate[];
        }
      }
    } catch (err: any) {
      console.warn('[LyricsService] Fallo en intento LRCLIB:', url, err?.message);
    }
  }

  return [];
}

/**
 * Proveedor secundario de fallback: Lyrist API / Lyrics.ovh
 */
async function searchFallback(cleanT: string, cleanA: string): Promise<LyricCandidate[]> {
  const titlesToTry: string[] = [cleanT];
  if (cleanT.includes(' x ') || cleanT.includes(' vs ')) {
    const parts = cleanT.split(/\s+(?:x|vs)\s+/i);
    titlesToTry.push(...parts.map((p) => p.trim()));
  }

  for (const t of titlesToTry) {
    try {
      const query = cleanA && cleanA !== 'desconocido' ? `${t}/${cleanA}` : t;
      const url = `https://lyrist.vercel.app/api/${encodeURIComponent(query)}`;
      console.log('[LyricsService] Petición Fallback (Lyrist):', url);
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics) {
          return [
            {
              trackName: data.title || t,
              artistName: data.artist || cleanA,
              plainLyrics: data.lyrics,
              syncedLyrics: null,
            },
          ];
        }
      }
    } catch (e: any) {
      console.log('[LyricsService] Error en fallback Lyrist:', e?.message);
    }

    if (cleanA && cleanA !== 'desconocido') {
      try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanA)}/${encodeURIComponent(t)}`;
        console.log('[LyricsService] Petición Fallback (Lyrics.ovh):', url);
        const res = await fetch(url, { headers: REQUEST_HEADERS });
        if (res.ok) {
          const data = await res.json();
          if (data && data.lyrics) {
            return [
              {
                trackName: t,
                artistName: cleanA,
                plainLyrics: data.lyrics,
                syncedLyrics: null,
              },
            ];
          }
        }
      } catch (e: any) {
        console.log('[LyricsService] Error en fallback Lyrics.ovh:', e?.message);
      }
    }
  }

  return [];
}

/**
 * Realiza la búsqueda de letras en APIs públicas (LRCLIB y fallbacks) aplicando matching difuso.
 */
export async function fetchOnlineLyrics(
  title: string,
  artist: string = '',
  duration: number = 0,
  threshold: number = 0.75,
  ignoreCache: boolean = false
): Promise<string | null> {
  if (!title || title === 'No Track' || title === 'Pista Desconocida') {
    return null;
  }

  const cleanT = cleanTitleOnly(title);
  const cleanA = cleanTitleOnly(artist || '');

  if (!cleanT) return null;

  // 1. Verificar caché local
  if (!ignoreCache) {
    const cached = await getCachedLyrics(title, artist);
    if (cached !== null) {
      console.log('[LyricsService] Retornando letra desde caché local para:', title);
      return cached === '' ? null : cached;
    }
  }

  console.log(
    `[LyricsService] Buscando letras en línea: Título="${cleanT}" | Artista="${cleanA}" (Umbral: ${Math.round(
      threshold * 100
    )}%)`
  );

  let results = await searchLrclib(cleanT, cleanA);

  if (!results || results.length === 0) {
    console.log('[LyricsService] Sin resultados en LRCLIB, buscando en servicios de respaldo...');
    results = await searchFallback(cleanT, cleanA);
  }

  if (!Array.isArray(results) || results.length === 0) {
    console.log('[LyricsService] No se encontraron resultados en ninguna API.');
    await setCachedLyrics(title, artist, '');
    return null;
  }

  let bestMatch: LyricCandidate | null = null;
  let highestScore = 0;

  for (const item of results) {
    const resTrack = item.trackName || '';
    const resArtist = item.artistName || '';

    const titleSim = calculateTitleSimilarity(cleanT, resTrack);
    const hasValidArtist = cleanA && cleanA !== 'desconocido' && cleanA !== 'artful';
    const artistSim = hasValidArtist ? calculateSimilarity(cleanA, resArtist) : 1.0;

    let combinedScore = titleSim;
    if (hasValidArtist && artistSim > 0.3) {
      combinedScore = titleSim * 0.7 + artistSim * 0.3;
    } else if (titleSim >= 0.8) {
      // Si el título coincide fuertemente (>= 80%), no penalizar si el artista local no coincide
      combinedScore = titleSim;
    } else {
      combinedScore = titleSim * 0.7 + artistSim * 0.3;
    }

    if (duration > 0 && typeof item.duration === 'number' && item.duration > 0) {
      const diffSec = Math.abs(duration - item.duration);
      if (diffSec <= 5) {
        combinedScore += 0.05;
      } else if (diffSec > 30) {
        combinedScore -= 0.1;
      }
    }

    console.log(
      `[LyricsService] Candidato: "${resTrack}" - "${resArtist}" -> Similitud: ${(combinedScore * 100).toFixed(1)}%`
    );

    if (combinedScore > highestScore) {
      highestScore = combinedScore;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= threshold) {
    const lyrics = bestMatch.syncedLyrics || bestMatch.plainLyrics || null;
    if (lyrics) {
      console.log(`[LyricsService] ¡Letra obtenida con éxito! (${(highestScore * 100).toFixed(1)}% coincidencia)`);
      await setCachedLyrics(title, artist, lyrics);
      return lyrics;
    }
  } else {
    console.log(
      `[LyricsService] Coincidencia máxima (${(highestScore * 100).toFixed(1)}%) estuvo por debajo del umbral (${Math.round(
        threshold * 100
      )}%)`
    );
  }

  await setCachedLyrics(title, artist, '');
  return null;
}
