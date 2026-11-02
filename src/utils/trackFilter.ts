/**
 * Utilidades para el filtrado y normalización de búsqueda en listas de canciones.
 */

import { Track } from '../models/Track';

export type SearchFilterId = 'all' | 'title' | 'artist' | 'album' | 'genre';

export interface SearchFilterOption {
  id: SearchFilterId;
  label: string;
  icon: string;
}

export const SEARCH_FILTERS: SearchFilterOption[] = [
  { id: 'all', label: 'Todos', icon: 'tag-multiple-outline' },
  { id: 'title', label: 'Título', icon: 'music-note-outline' },
  { id: 'artist', label: 'Artista', icon: 'account-outline' },
  { id: 'album', label: 'Álbum', icon: 'album' },
  { id: 'genre', label: 'Género', icon: 'guitar-acoustic' },
];

/**
 * Conteo reactivo de coincidencias por categoría de filtro.
 */
export interface OdooFilterCounts {
  all: number;
  title: number;
  artist: number;
  album: number;
  genre: number;
}

/**
 * Normaliza cadenas para comparaciones de búsqueda insensibles a mayúsculas y acentos.
 *
 * @param str Cadena de texto de entrada
 * @returns Cadena normalizada sin acentos y en minúsculas
 */
export function normalizeSearchString(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Filtra una lista de canciones según el criterio y el texto de búsqueda.
 *
 * @param list Lista de canciones
 * @param rawQuery Consulta de búsqueda introducida por el usuario
 * @param filterMode Campo específico ('all', 'title', 'artist', 'album', 'genre')
 * @returns Lista filtrada de canciones
 */
export function filterTrackList<T extends Partial<Track>>(
  list?: T[] | null,
  rawQuery?: string | null,
  filterMode: SearchFilterId | string = 'all'
): T[] {
  if (!list || list.length === 0) return [];
  if (!rawQuery || rawQuery.trim() === '') return list;

  const query = normalizeSearchString(rawQuery);
  if (!query) return list;

  return list.filter((track) => {
    const title = normalizeSearchString(track.title);
    const artist = normalizeSearchString(track.artist);
    const album = normalizeSearchString(track.album);
    const genre = normalizeSearchString(track.genre);

    switch (filterMode) {
      case 'title':
        return title.includes(query);
      case 'artist':
        return artist.includes(query);
      case 'album':
        return album.includes(query);
      case 'genre':
        return genre.includes(query);
      case 'all':
      default:
        return (
          title.includes(query) ||
          artist.includes(query) ||
          album.includes(query) ||
          genre.includes(query)
        );
    }
  });
}

/**
 * Calcula conteos reactivos por categoría para las sugerencias del buscador.
 *
 * @param activeContextTracks Pistas activas en el contexto actual
 * @param searchQuery Texto de búsqueda
 * @returns Conteo por categoría
 */
export function calculateOdooFilterCounts<T extends Partial<Track>>(
  activeContextTracks?: T[] | null,
  searchQuery?: string | null
): OdooFilterCounts {
  if (!searchQuery || searchQuery.trim() === '' || !activeContextTracks || activeContextTracks.length === 0) {
    return { all: 0, title: 0, artist: 0, album: 0, genre: 0 };
  }
  const q = normalizeSearchString(searchQuery);
  let allCount = 0;
  let titleCount = 0;
  let artistCount = 0;
  let albumCount = 0;
  let genreCount = 0;

  for (const track of activeContextTracks) {
    const t = normalizeSearchString(track.title);
    const a = normalizeSearchString(track.artist);
    const al = normalizeSearchString(track.album);
    const g = normalizeSearchString(track.genre);

    const matchesTitle = t.includes(q);
    const matchesArtist = a.includes(q);
    const matchesAlbum = al.includes(q);
    const matchesGenre = g.includes(q);

    if (matchesTitle) titleCount++;
    if (matchesArtist) artistCount++;
    if (matchesAlbum) albumCount++;
    if (matchesGenre) genreCount++;
    if (matchesTitle || matchesArtist || matchesAlbum || matchesGenre) allCount++;
  }

  return {
    all: allCount,
    title: titleCount,
    artist: artistCount,
    album: albumCount,
    genre: genreCount,
  };
}
