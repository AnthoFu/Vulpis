/**
 * Modelo de datos y utilidades para las Listas de Reproducción (Playlist) en Vulpis.
 */

import { Track, sanitizeTrackForStorage } from './Track';

export const FAVORITES_PLAYLIST_ID = 'favorites';
export const FAVORITES_PLAYLIST_NAME = 'Favoritos';

/**
 * Modelo de dominio para una Lista de Reproducción.
 */
export interface Playlist {
  /** Identificador único de la lista (ej: 'favorites', 'playlist-1712345678') */
  id: string;
  /** Nombre visual de la lista */
  name: string;
  /** Indica si es la lista especial automática de Favoritos */
  isFavorites?: boolean;
  /** Colección ordenada de canciones */
  tracks: Track[];
  /** Timestamp de creación */
  createdAt?: number;
  /** Timestamp de última actualización */
  updatedAt?: number;
}

/**
 * Parámetros para la creación de una nueva Playlist.
 */
export interface CreatePlaylistParams {
  id?: string;
  name: string;
  isFavorites?: boolean;
  tracks?: Track[];
}

/**
 * Crea una nueva instancia de Playlist con valores consistentes y seguros.
 *
 * @param params Parámetros de la lista
 * @returns Instancia normalizada de Playlist
 */
export function createPlaylist(params: CreatePlaylistParams): Playlist {
  const isFav = params.isFavorites === true || params.id === FAVORITES_PLAYLIST_ID;
  const id = isFav ? FAVORITES_PLAYLIST_ID : params.id || `playlist-${Date.now()}`;
  const name = isFav ? FAVORITES_PLAYLIST_NAME : params.name.trim() || 'Nueva Playlist';
  const now = Date.now();

  const sanitizedTracks = (params.tracks || [])
    .map((t) => sanitizeTrackForStorage(t))
    .filter((t): t is Track => t !== null);

  return {
    id,
    name,
    isFavorites: isFav,
    tracks: sanitizedTracks,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Garantiza que la lista de reproducción de Favoritos siempre exista en la colección
 * y se ubique en la primera posición del array.
 *
 * @param list Lista de playlists actual
 * @returns Colección de playlists con Favoritos garantizada al principio
 */
export function ensureFavoritesPlaylist(list: Playlist[] | null | undefined): Playlist[] {
  const currentList = Array.isArray(list) ? list : [];
  const favIndex = currentList.findIndex(
    (p) =>
      p.id === FAVORITES_PLAYLIST_ID ||
      p.isFavorites === true ||
      p.name?.toLowerCase() === 'favoritos'
  );

  if (favIndex !== -1) {
    const existingFav = currentList[favIndex];
    const normalizedFav: Playlist = {
      ...existingFav,
      id: FAVORITES_PLAYLIST_ID,
      name: FAVORITES_PLAYLIST_NAME,
      isFavorites: true,
      tracks: Array.isArray(existingFav.tracks) ? existingFav.tracks : [],
    };
    const others = currentList.filter((_, idx) => idx !== favIndex);
    return [normalizedFav, ...others];
  }

  const defaultFav: Playlist = {
    id: FAVORITES_PLAYLIST_ID,
    name: FAVORITES_PLAYLIST_NAME,
    isFavorites: true,
    tracks: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return [defaultFav, ...currentList];
}

/**
 * Sanitiza una colección completa de playlists antes de guardarla en AsyncStorage
 * para proteger la base de datos de SQLite contra CursorWindow (2MB).
 *
 * @param playlists Colección de playlists
 * @returns Colección serializable y segura
 */
export function sanitizePlaylistsForStorage(playlists: Playlist[]): Playlist[] {
  return playlists.map((p) => ({
    ...p,
    tracks: (p.tracks || [])
      .map((t) => sanitizeTrackForStorage(t))
      .filter((t): t is Track => t !== null),
    updatedAt: Date.now(),
  }));
}
