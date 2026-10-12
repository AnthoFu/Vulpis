import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'vulpis_online_lyrics_cache';
const SETTINGS_KEY = 'vulpis_settings';
const CUSTOM_LYRICS_KEY = 'vulpis_custom_lyrics';

export const DEFAULT_SETTINGS = {
  onlineLyricsEnabled: false, // Desactivado por defecto
  matchThreshold: 0.75,       // 75% de coincidencia mínima por defecto
  preferOnlineOverID3: true,  // Reemplazar letras ID3 por defecto con las de la API cuando la búsqueda esté activa
};

const REQUEST_HEADERS = {
  'User-Agent': 'Vulpis-MusicPlayer/1.0.0 (https://github.com/AnthoFu/Vulpis)',
  'Accept': 'application/json',
};

/**
 * Lee la letra personalizada guardada manualmente por el usuario.
 */
export async function getCustomLyrics(mediaId) {
  if (!mediaId) return null;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[mediaId] || null;
  } catch (e) {
    console.error('[onlineLyrics] Error leyendo letra personalizada:', e);
    return null;
  }
}

/**
 * Guarda o actualiza manualmente la letra personalizada de una canción.
 */
export async function saveCustomLyrics(mediaId, lyrics) {
  if (!mediaId) return;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[mediaId] = lyrics;
    await AsyncStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('[onlineLyrics] Error guardando letra personalizada:', e);
  }
}

/**
 * Elimina la letra personalizada para restaurar la letra por defecto.
 */
export async function removeCustomLyrics(mediaId) {
  if (!mediaId) return;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_LYRICS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[mediaId];
    await AsyncStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('[onlineLyrics] Error eliminando letra personalizada:', e);
  }
}

/**
 * Carga la configuración de la aplicación desde AsyncStorage
 */
export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('[onlineLyrics] Error leyendo ajustes:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Guarda los ajustes en AsyncStorage
 */
export async function saveSettings(newSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (e) {
    console.error('[onlineLyrics] Error guardando ajustes:', e);
  }
}

/**
 * Limpia el título quitando etiquetas de descargas, colaboraciones (feat/ft) y extensiones.
 */
export function cleanTitleOnly(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\.(mp3|flac|m4a|wav|aac|ogg|opus)$/i, '')
    // Eliminar etiquetas de colaboraciones entre paréntesis o corchetes: (feat. ...), [ft. ...]
    .replace(/\((feat|ft|featuring|with)[^)]*\)/gi, '')
    .replace(/\[(feat|ft|featuring|with)[^\]]*\]/gi, '')
    .replace(/(feat|ft|featuring)\.?\s+[\w\s]+/gi, '')
    // Eliminar etiquetas de calidad y tipo de video
    .replace(/\[(official|audio|video|lyric|hd|remastered|4k|version|live|cover completo|mp3_\d+k)[^\]]*\]/gi, '')
    .replace(/\((official|audio|video|lyric|hd|remastered|4k|version|live|cover completo|mp3_\d+k)[^)]*\)/gi, '')
    .replace(/mp3_\d+k/gi, '')
    .replace(/karaoke de/gi, '')
    .replace(/cover completo/gi, '')
    // Eliminar caracteres especiales manteniendo letras con tildes y espacios
    .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanString(str) {
  return cleanTitleOnly(str);
}

/**
 * Algoritmo de Coeficiente de Sørensen-Dice para calcular similitud entre 2 cadenas.
 * Retorna un número flotante entre 0.0 (0%) y 1.0 (100%).
 */
export function calculateSimilarity(str1, str2) {
  const s1 = cleanTitleOnly(str1);
  const s2 = cleanTitleOnly(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.length < 2 || s2.length < 2) {
    return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0.0;
  }

  const getBigrams = (text) => {
    const bigrams = new Map();
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.substring(i, i + 2);
      const count = bigrams.get(bigram) || 0;
      bigrams.set(bigram, count + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bigrams1.entries()) {
    const count2 = bigrams2.get(bigram) || 0;
    intersection += Math.min(count1, count2);
  }

  const totalBigrams = (s1.length - 1) + (s2.length - 1);
  return (2.0 * intersection) / totalBigrams;
}

/**
 * Calcula similitud avanzada de títulos permitiendo coincidencia por subcadenas o títulos truncados.
 */
export function calculateTitleSimilarity(str1, str2) {
  const s1 = cleanTitleOnly(str1);
  const s2 = cleanTitleOnly(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const bigramSim = calculateSimilarity(s1, s2);

  // Si un título está contenido dentro del otro (ej: "me enamoré de alguien" dentro de "me enamoré de alguien que también")
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    const ratio = minLen / maxLen;
    // Otorgar un valor mínimo de 0.85 a títulos truncados/parciales
    if (ratio >= 0.4) {
      return Math.max(bigramSim, 0.88);
    }
  }

  return bigramSim;
}

function getCacheKey(title, artist) {
  const cleanT = cleanTitleOnly(title);
  const cleanA = cleanTitleOnly(artist);
  return `${cleanA}__${cleanT}`;
}

export async function getCachedLyrics(title, artist) {
  try {
    const rawCache = await AsyncStorage.getItem(CACHE_KEY);
    if (!rawCache) return null;
    const cache = JSON.parse(rawCache);
    const key = getCacheKey(title, artist);
    return cache[key] !== undefined ? cache[key] : null;
  } catch (e) {
    console.error('[onlineLyrics] Error leyendo caché de letras:', e);
    return null;
  }
}

export async function setCachedLyrics(title, artist, lyrics) {
  try {
    const rawCache = await AsyncStorage.getItem(CACHE_KEY);
    const cache = rawCache ? JSON.parse(rawCache) : {};
    const key = getCacheKey(title, artist);
    cache[key] = lyrics;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('[onlineLyrics] Error guardando en caché de letras:', e);
  }
}

export async function clearLyricsCache() {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error('[onlineLyrics] Error limpiando caché de letras:', e);
  }
}

/**
 * Consulta la API pública LRCLIB mediante múltiples estrategias progresivas con 'q' y búsquedas divididas.
 */
async function searchLrclib(cleanT, cleanA) {
  const queriesToTry = [];

  // 1. Título + Artista
  if (cleanA && cleanA !== 'desconocido' && cleanA !== 'artful') {
    queriesToTry.push(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanT} ${cleanA}`)}`);
  }

  // 2. Solo Título limpio
  queriesToTry.push(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanT)}`);

  // 3. Si el título incluye separadores como 'x' o 'vs' (ej: Blade x Into The Void), intentar partes individuales
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
      console.log('[onlineLyrics] Petición LRCLIB:', url);
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      }
    } catch (err) {
      console.warn('[onlineLyrics] Fallo en intento LRCLIB:', url, err.message);
    }
  }

  return [];
}

/**
 * Proveedor secundario de fallback: Lyrist API / Lyrics.ovh
 */
async function searchFallback(cleanT, cleanA) {
  const titlesToTry = [cleanT];
  if (cleanT.includes(' x ') || cleanT.includes(' vs ')) {
    const parts = cleanT.split(/\s+(?:x|vs)\s+/i);
    titlesToTry.push(...parts.map(p => p.trim()));
  }

  for (const t of titlesToTry) {
    try {
      const query = (cleanA && cleanA !== 'desconocido') ? `${t}/${cleanA}` : t;
      const url = `https://lyrist.vercel.app/api/${encodeURIComponent(query)}`;
      console.log('[onlineLyrics] Petición Fallback (Lyrist):', url);
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics) {
          return [{
            trackName: data.title || t,
            artistName: data.artist || cleanA,
            plainLyrics: data.lyrics,
            syncedLyrics: null,
          }];
        }
      }
    } catch (e) {
      console.log('[onlineLyrics] Error en fallback Lyrist:', e.message);
    }

    if (cleanA && cleanA !== 'desconocido') {
      try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanA)}/${encodeURIComponent(t)}`;
        console.log('[onlineLyrics] Petición Fallback (Lyrics.ovh):', url);
        const res = await fetch(url, { headers: REQUEST_HEADERS });
        if (res.ok) {
          const data = await res.json();
          if (data && data.lyrics) {
            return [{
              trackName: t,
              artistName: cleanA,
              plainLyrics: data.lyrics,
              syncedLyrics: null,
            }];
          }
        }
      } catch (e) {
        console.log('[onlineLyrics] Error en fallback Lyrics.ovh:', e.message);
      }
    }
  }

  return [];
}

/**
 * Realiza la búsqueda de letras en APIs públicas.
 */
export async function fetchOnlineLyrics(title, artist, duration = 0, threshold = 0.75, ignoreCache = false) {
  if (!title || title === 'No Track' || title === 'Pista Desconocida') {
    return null;
  }

  const cleanT = cleanTitleOnly(title);
  const cleanA = cleanTitleOnly(artist || '');

  if (!cleanT) return null;

  // 1. Verificar caché local (si no se solicita ignorar el caché)
  if (!ignoreCache) {
    const cached = await getCachedLyrics(title, artist);
    if (cached !== null) {
      console.log('[onlineLyrics] Retornando letra desde caché local para:', title);
      return cached === '' ? null : cached;
    }
  }

  console.log(`[onlineLyrics] Buscando letras en línea: Título="${cleanT}" | Artista="${cleanA}" (Umbral: ${Math.round(threshold * 100)}%)`);

  let results = await searchLrclib(cleanT, cleanA);

  if (!results || results.length === 0) {
    console.log('[onlineLyrics] Sin resultados en LRCLIB, buscando en servicios de respaldo...');
    results = await searchFallback(cleanT, cleanA);
  }

  if (!Array.isArray(results) || results.length === 0) {
    console.log('[onlineLyrics] No se encontraron resultados en ninguna API.');
    await setCachedLyrics(title, artist, '');
    return null;
  }

  let bestMatch = null;
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
      // Si el título coincide fuertemente (>= 80%), no penalizar si el artista local no coincide (ej. karaoke/cover)
      combinedScore = titleSim;
    } else {
      combinedScore = titleSim * 0.7 + artistSim * 0.3;
    }

    if (duration > 0 && item.duration > 0) {
      const diffSec = Math.abs(duration - item.duration);
      if (diffSec <= 5) {
        combinedScore += 0.05;
      } else if (diffSec > 30) {
        combinedScore -= 0.1;
      }
    }

    console.log(`[onlineLyrics] Candidato: "${resTrack}" - "${resArtist}" -> Similitud: ${(combinedScore * 100).toFixed(1)}%`);

    if (combinedScore > highestScore) {
      highestScore = combinedScore;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= threshold) {
    const lyrics = bestMatch.syncedLyrics || bestMatch.plainLyrics || null;
    if (lyrics) {
      console.log(`[onlineLyrics] ¡Letra obtenida con éxito! (${(highestScore * 100).toFixed(1)}% coincidencia)`);
      await setCachedLyrics(title, artist, lyrics);
      return lyrics;
    }
  } else {
    console.log(`[onlineLyrics] Coincidencia máxima (${(highestScore * 100).toFixed(1)}%) estuvo por debajo del umbral (${Math.round(threshold * 100)}%)`);
  }

  await setCachedLyrics(title, artist, '');
  return null;
}
