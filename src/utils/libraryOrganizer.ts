/**
 * Utilidades para la organización por pestañas de la biblioteca de Vulpis:
 * Canciones, Árbol de Artistas, Álbumes y Playlists.
 */

import { Track } from '../models/Track';

export type LibraryTabId = 'songs' | 'artists' | 'albums' | 'playlists';

export interface LibraryTabItem {
  id: LibraryTabId;
  label: string;
  icon: string;
}

export const LIBRARY_TABS: LibraryTabItem[] = [
  { id: 'songs', label: 'Canciones', icon: 'music-note' },
  { id: 'artists', label: 'Artistas', icon: 'account-outline' },
  { id: 'albums', label: 'Álbumes', icon: 'album' },
  { id: 'playlists', label: 'Playlists', icon: 'playlist-music-outline' },
];

/**
 * Normaliza cadenas para comparaciones sin distinción de mayúsculas ni acentos.
 */
function normalizeString(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Estructura de un álbum dentro del árbol de un artista.
 */
export interface ArtistAlbumNode {
  id: string;
  title: string;
  artworkUrl: string | null;
  tracks: Track[];
}

/**
 * Estructura de un nodo de artista con sus álbumes y canciones agrupadas.
 */
export interface ArtistNode {
  id: string;
  name: string;
  artworkUrl: string | null;
  trackCount: number;
  albumCount: number;
  albums: ArtistAlbumNode[];
  tracks: Track[];
}

/**
 * Estructura de un álbum agrupado de forma global en la biblioteca.
 */
export interface AlbumNode {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  tracks: Track[];
  trackCount: number;
}

interface InternalArtistData {
  id: string;
  name: string;
  artworkUrl: string | null;
  tracksCount: number;
  albumsMap: Map<string, ArtistAlbumNode>;
}

/**
 * Construye el Árbol de Artistas jerárquico a partir de la lista de canciones:
 * Artista -> Álbumes del artista -> Pistas de cada álbum.
 *
 * @param tracks Lista completa de canciones.
 * @returns Lista de artistas ordenados alfabéticamente con su árbol de álbumes y pistas.
 */
export function buildArtistTree(tracks?: Track[] | null): ArtistNode[] {
  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) return [];
  const artistMap = new Map<string, InternalArtistData>();

  for (const track of tracks) {
    const rawArtist =
      track.artist && track.artist.trim() !== ''
        ? track.artist.trim()
        : 'Artista Desconocido';
    const artistKey = normalizeString(rawArtist) || 'artista-desconocido';

    if (!artistMap.has(artistKey)) {
      artistMap.set(artistKey, {
        id: `artist-${artistKey}`,
        name: rawArtist,
        artworkUrl: null,
        tracksCount: 0,
        albumsMap: new Map<string, ArtistAlbumNode>(),
      });
    }

    const artistObj = artistMap.get(artistKey)!;
    artistObj.tracksCount++;
    if (!artistObj.artworkUrl && track.artworkUrl) {
      artistObj.artworkUrl = track.artworkUrl;
    }

    const rawAlbum =
      track.album &&
      track.album.trim() !== '' &&
      track.album !== 'Álbum Desconocido' &&
      track.album !== 'Desconocido'
        ? track.album.trim()
        : 'Sencillos y otras pistas';
    const albumKey = normalizeString(rawAlbum) || 'sencillos-y-otras-pistas';

    if (!artistObj.albumsMap.has(albumKey)) {
      artistObj.albumsMap.set(albumKey, {
        id: `artist-${artistKey}-album-${albumKey}`,
        title: rawAlbum,
        artworkUrl: track.artworkUrl || null,
        tracks: [],
      });
    }

    const albumObj = artistObj.albumsMap.get(albumKey)!;
    albumObj.tracks.push(track);
    if (!albumObj.artworkUrl && track.artworkUrl) {
      albumObj.artworkUrl = track.artworkUrl;
    }
  }

  return Array.from(artistMap.values())
    .map((artist) => {
      const albums = Array.from(artist.albumsMap.values());
      const allTracks = albums.flatMap((a) => a.tracks);
      const namedAlbumsCount = albums.filter(
        (a) => a.title !== 'Sencillos y otras pistas'
      ).length;

      return {
        id: artist.id,
        name: artist.name,
        artworkUrl: artist.artworkUrl,
        trackCount: artist.tracksCount,
        albumCount: namedAlbumsCount,
        albums,
        tracks: allTracks,
      };
    })
    .sort((a, b) => {
      if (a.name === 'Artista Desconocido') return 1;
      if (b.name === 'Artista Desconocido') return -1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

/**
 * Agrupa la lista de canciones en colecciones por Álbum.
 *
 * @param tracks Lista completa de canciones.
 * @returns Lista de álbumes ordenados alfabéticamente con carátula y pistas.
 */
export function buildAlbumList(tracks?: Track[] | null): AlbumNode[] {
  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) return [];
  const albumMap = new Map<string, { id: string; title: string; artist: string; artworkUrl: string | null; tracks: Track[] }>();

  for (const track of tracks) {
    const rawAlbum =
      track.album &&
      track.album.trim() !== '' &&
      track.album !== 'Álbum Desconocido' &&
      track.album !== 'Desconocido'
        ? track.album.trim()
        : 'Álbum Desconocido';
    const rawArtist =
      track.artist && track.artist.trim() !== ''
        ? track.artist.trim()
        : 'Varios Artistas';

    const albumKey = `${normalizeString(rawAlbum)}:::${normalizeString(rawArtist)}`;

    if (!albumMap.has(albumKey)) {
      albumMap.set(albumKey, {
        id: `album-${albumKey}`,
        title: rawAlbum,
        artist: rawArtist,
        artworkUrl: null,
        tracks: [],
      });
    }

    const albumObj = albumMap.get(albumKey)!;
    albumObj.tracks.push(track);
    if (!albumObj.artworkUrl && track.artworkUrl) {
      albumObj.artworkUrl = track.artworkUrl;
    }
  }

  return Array.from(albumMap.values())
    .map((album) => ({
      ...album,
      trackCount: album.tracks.length,
    }))
    .sort((a, b) => {
      if (a.title === 'Álbum Desconocido') return 1;
      if (b.title === 'Álbum Desconocido') return -1;
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    });
}

/**
 * Filtra la lista de artistas según el texto de búsqueda.
 *
 * @param artistList Lista de nodos de artista
 * @param rawQuery Consulta de búsqueda
 * @returns Artistas que coinciden con la búsqueda
 */
export function filterArtists(artistList?: ArtistNode[] | null, rawQuery?: string | null): ArtistNode[] {
  if (!artistList || artistList.length === 0) return [];
  if (!rawQuery || rawQuery.trim() === '') return artistList;

  const query = normalizeString(rawQuery);
  if (!query) return artistList;

  return artistList.filter((artist) => {
    return normalizeString(artist.name).includes(query);
  });
}

/**
 * Filtra la lista de álbumes según el texto de búsqueda (por título o artista).
 *
 * @param albumList Lista de nodos de álbum
 * @param rawQuery Consulta de búsqueda
 * @returns Álbumes coincidentes
 */
export function filterAlbums(albumList?: AlbumNode[] | null, rawQuery?: string | null): AlbumNode[] {
  if (!albumList || albumList.length === 0) return [];
  if (!rawQuery || rawQuery.trim() === '') return albumList;

  const query = normalizeString(rawQuery);
  if (!query) return albumList;

  return albumList.filter((album) => {
    return (
      normalizeString(album.title).includes(query) ||
      normalizeString(album.artist).includes(query)
    );
  });
}
