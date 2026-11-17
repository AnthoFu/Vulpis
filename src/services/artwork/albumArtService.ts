/**
 * Servicio de búsqueda, descarga y resolución de Carátulas de Álbumes (Album Art Fetcher)
 * Soporta fuentes públicas abiertas: iTunes Search API, Deezer API y Cover Art Archive (MusicBrainz),
 * así como selección de imágenes locales mediante DocumentPicker.
 */

import { simpleHash } from '../../utils/artwork';

function isWebEnvironment(): boolean {
  try {
    const { Platform } = require('react-native');
    return Platform?.OS === 'web';
  } catch {
    return typeof window !== 'undefined';
  }
}

// Carga perezosa de FileSystem y DocumentPicker para compatibilidad en entornos Node/Web
let fileSystemModule: typeof import('expo-file-system/legacy') | null = null;
function getFileSystem() {
  if (!fileSystemModule) {
    try {
      fileSystemModule = require('expo-file-system/legacy');
    } catch {
      fileSystemModule = null;
    }
  }
  return fileSystemModule;
}

let documentPickerModule: typeof import('expo-document-picker') | null = null;
function getDocumentPicker() {
  if (!documentPickerModule) {
    try {
      documentPickerModule = require('expo-document-picker');
    } catch {
      documentPickerModule = null;
    }
  }
  return documentPickerModule;
}

const REQUEST_HEADERS = {
  'User-Agent': 'Vulpis-MusicPlayer/0.5.31 (https://github.com/AnthoFu/Vulpis)',
  Accept: 'application/json',
};

const ITUNES_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Vulpis/0.5.31',
  Accept: 'application/json',
};

/**
 * Representación normalizada de un candidato de carátula obtenido de un servicio externo.
 */
export interface AlbumArtCandidate {
  /** Identificador único del candidato */
  id: string;
  /** Título de la pista o álbum */
  title?: string;
  /** Nombre del artista */
  artist?: string;
  /** Nombre del álbum */
  album?: string;
  /** Proveedor de origen */
  source: 'iTunes' | 'Deezer' | 'Cover Art Archive';
  /** URL de vista previa reducida (miniatura rápida para la lista) */
  thumbnailUrl: string;
  /** URL de imagen en alta resolución (para descarga y asignación) */
  fullUrl: string;
  /** Ancho estimado en píxeles */
  width?: number;
  /** Alto estimado en píxeles */
  height?: number;
  /** Etiqueta descriptiva para la interfaz de usuario */
  badge?: string;
}

/**
 * Busca candidatos de carátula en iTunes Search API.
 * Reemplaza la URL estándar de 100x100 por resolución HD (600x600 o 1000x1000).
 *
 * @param query Texto de búsqueda (artista, álbum o canción)
 * @param limit Número máximo de resultados
 */
export async function searchAlbumArtITunes(
  query: string,
  limit: number = 8
): Promise<AlbumArtCandidate[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    const candidates: AlbumArtCandidate[] = [];
    const seenUrls = new Set<string>();

    // 1. Intentar primero búsqueda por entidad 'album'
    const albumUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      cleanQ
    )}&entity=album&limit=${limit}`;
    const albumController = new AbortController();
    const albumTimer = setTimeout(() => albumController.abort(), 6000);
    const albumRes = await fetch(albumUrl, {
      headers: ITUNES_HEADERS,
      signal: albumController.signal,
    }).finally(() => clearTimeout(albumTimer));

    if (albumRes.ok) {
      const data = await albumRes.json();
      if (data?.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (!item.artworkUrl100) continue;
          // Reemplazo de alta resolución a 600x600 píxeles
          const fullUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
          if (seenUrls.has(fullUrl)) continue;
          seenUrls.add(fullUrl);

          candidates.push({
            id: `itunes-album-${item.collectionId || Math.random().toString(36).substring(2, 8)}`,
            title: item.collectionName,
            artist: item.artistName,
            album: item.collectionName,
            source: 'iTunes',
            thumbnailUrl: item.artworkUrl100,
            fullUrl,
            width: 600,
            height: 600,
            badge: 'HD (iTunes)',
          });
        }
      }
    }

    // 2. Si hay pocos resultados de álbum, complementar con entidad 'song'
    if (candidates.length < 4) {
      const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        cleanQ
      )}&entity=song&limit=${limit}`;
      const songController = new AbortController();
      const songTimer = setTimeout(() => songController.abort(), 6000);
      const songRes = await fetch(songUrl, {
        headers: ITUNES_HEADERS,
        signal: songController.signal,
      }).finally(() => clearTimeout(songTimer));

      if (songRes.ok) {
        const songData = await songRes.json();
        if (songData?.results && Array.isArray(songData.results)) {
          for (const item of songData.results) {
            if (!item.artworkUrl100) continue;
            const fullUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
            if (seenUrls.has(fullUrl)) continue;
            seenUrls.add(fullUrl);

            candidates.push({
              id: `itunes-song-${item.trackId || Math.random().toString(36).substring(2, 8)}`,
              title: item.trackName,
              artist: item.artistName,
              album: item.collectionName,
              source: 'iTunes',
              thumbnailUrl: item.artworkUrl100,
              fullUrl,
              width: 600,
              height: 600,
              badge: 'HD (iTunes)',
            });
          }
        }
      }
    }

    return candidates;
  } catch (err) {
    console.warn('[AlbumArtService] Error en búsqueda de iTunes:', err);
    return [];
  }
}

/**
 * Busca candidatos de carátula en la API de Deezer.
 * Proporciona imágenes de hasta 1000x1000 píxeles (cover_xl).
 *
 * @param query Texto de búsqueda (artista, canción o álbum)
 * @param limit Número máximo de resultados
 */
export async function searchAlbumArtDeezer(
  query: string,
  limit: number = 8
): Promise<AlbumArtCandidate[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}`;
    const deezerController = new AbortController();
    const deezerTimer = setTimeout(() => deezerController.abort(), 6000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: deezerController.signal,
    }).finally(() => clearTimeout(deezerTimer));
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data)) return [];

    const candidates: AlbumArtCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const item of data.data) {
      const album = item.album;
      if (!album) continue;

      const fullUrl = album.cover_xl || album.cover_big || album.cover_medium;
      if (!fullUrl || seenUrls.has(fullUrl)) continue;
      seenUrls.add(fullUrl);

      candidates.push({
        id: `deezer-${album.id || item.id || Math.random().toString(36).substring(2, 8)}`,
        title: item.title,
        artist: item.artist?.name,
        album: album.title,
        source: 'Deezer',
        thumbnailUrl: album.cover_medium || fullUrl,
        fullUrl,
        width: 1000,
        height: 1000,
        badge: 'HQ (Deezer)',
      });
    }

    return candidates;
  } catch (err) {
    console.warn('[AlbumArtService] Error en búsqueda de Deezer:', err);
    return [];
  }
}

/**
 * Busca carátulas en MusicBrainz y resuelve la URL de Cover Art Archive.
 *
 * @param query Texto de búsqueda del álbum o artista
 * @param limit Número máximo de resultados
 */
export async function searchAlbumArtCoverArtArchive(
  query: string,
  limit: number = 4
): Promise<AlbumArtCandidate[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    const url = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(
      cleanQ
    )}&fmt=json&limit=${limit}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return [];

    const data = await res.json();
    const releaseGroups = data?.['release-groups'];
    if (!releaseGroups || !Array.isArray(releaseGroups)) return [];

    const candidates: AlbumArtCandidate[] = [];
    for (const rg of releaseGroups) {
      const mbid = rg.id;
      if (!mbid) continue;

      const fullUrl = `https://coverartarchive.org/release-group/${mbid}/front-500`;
      const thumbnailUrl = `https://coverartarchive.org/release-group/${mbid}/front-250`;
      const artistName = rg['artist-credit']?.[0]?.name || 'Artista';

      candidates.push({
        id: `caa-rg-${mbid}`,
        title: rg.title,
        artist: artistName,
        album: rg.title,
        source: 'Cover Art Archive',
        thumbnailUrl,
        fullUrl,
        width: 500,
        height: 500,
        badge: 'Cover Art Archive',
      });
    }

    return candidates;
  } catch (err) {
    console.warn('[AlbumArtService] Error en búsqueda de Cover Art Archive:', err);
    return [];
  }
}

/**
 * Realiza una búsqueda unificada y simultánea en múltiples proveedores públicos
 * (iTunes, Deezer, Cover Art Archive) deduplicando y agrupando los resultados.
 *
 * @param query Cadena de búsqueda (ej: "Queen A Night at the Opera")
 * @param limit Límite aproximado de candidatos retornados
 */
export async function searchAlbumArtCandidates(
  query: string,
  limit: number = 15
): Promise<AlbumArtCandidate[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  // Consulta paralela y resiliente
  const [itunesRes, deezerRes, caaRes] = await Promise.allSettled([
    searchAlbumArtITunes(cleanQ, Math.ceil(limit / 2)),
    searchAlbumArtDeezer(cleanQ, Math.ceil(limit / 2)),
    searchAlbumArtCoverArtArchive(cleanQ, 4),
  ]);

  const candidates: AlbumArtCandidate[] = [];
  const seenUrls = new Set<string>();

  const addItems = (items: AlbumArtCandidate[]) => {
    for (const item of items) {
      if (!seenUrls.has(item.fullUrl)) {
        seenUrls.add(item.fullUrl);
        candidates.push(item);
      }
    }
  };

  // Priorizar iTunes y Deezer por velocidad de CDN y alta resolución
  if (itunesRes.status === 'fulfilled') addItems(itunesRes.value);
  if (deezerRes.status === 'fulfilled') addItems(deezerRes.value);
  if (caaRes.status === 'fulfilled') addItems(caaRes.value);

  return candidates.slice(0, limit);
}

/**
 * Descarga una carátula remota y la almacena localmente en la caché física del dispositivo
 * para evitar descargas repetidas y desbordamientos SQLite de CursorWindow en AsyncStorage.
 *
 * @param remoteUrl URL HTTP/HTTPS de la imagen seleccionada
 * @param mediaId Identificador de la pista para hash único de archivo
 * @returns URI local ('file:///...') en móvil o URL directa en Web
 */
export async function downloadAndCacheArtwork(
  remoteUrl: string,
  mediaId?: string | null
): Promise<string | null> {
  if (!remoteUrl) return null;

  try {
    if (isWebEnvironment()) {
      return remoteUrl;
    }

    const FileSystem = getFileSystem();
    if (!FileSystem || !FileSystem.cacheDirectory) {
      return remoteUrl;
    }

    const coversDir = `${FileSystem.cacheDirectory}covers/`;
    const info = await FileSystem.getInfoAsync(coversDir).catch(() => ({ exists: false }));
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(coversDir, { intermediates: true }).catch(() => {});
    }

    const hash = simpleHash(mediaId || remoteUrl);
    const targetPath = `${coversDir}art_${hash}.jpg`;

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, targetPath);
    if (downloadResult && (downloadResult.status === 200 || downloadResult.status === 304)) {
      return downloadResult.uri;
    }

    return targetPath;
  } catch (err) {
    console.warn('[AlbumArtService] Error descargando carátula a disco:', err);
    return remoteUrl;
  }
}

/**
 * Abre el selector de documentos/imágenes del sistema para que el usuario elija
 * una carátula personalizada desde su almacenamiento o galería.
 *
 * @param mediaId Identificador de la canción asociada
 * @returns URI local de la imagen guardada en la caché de carátulas o null si canceló
 */
export async function pickLocalArtwork(mediaId?: string | null): Promise<string | null> {
  try {
    const DocumentPicker = getDocumentPicker();
    if (!DocumentPicker) return null;

    const res = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }

    const asset = res.assets[0];
    if (isWebEnvironment()) {
      return asset.uri;
    }

    const FileSystem = getFileSystem();
    if (!FileSystem || !FileSystem.cacheDirectory) {
      return asset.uri;
    }

    const coversDir = `${FileSystem.cacheDirectory}covers/`;
    const info = await FileSystem.getInfoAsync(coversDir).catch(() => ({ exists: false }));
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(coversDir, { intermediates: true }).catch(() => {});
    }

    const hash = simpleHash(mediaId || asset.uri);
    const isPng = asset.name?.toLowerCase().endsWith('.png') || asset.mimeType?.includes('png');
    const ext = isPng ? 'png' : 'jpg';
    const targetPath = `${coversDir}art_${hash}.${ext}`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: targetPath,
    });

    return targetPath;
  } catch (err) {
    console.warn('[AlbumArtService] Error seleccionando imagen local:', err);
    return null;
  }
}
