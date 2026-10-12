import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FAVORITES_PLAYLIST_ID = 'favorites';
export const FAVORITES_PLAYLIST_NAME = 'Favoritos';

/**
 * Sanitiza una pista antes de almacenarla en la lista de reproducción para evitar
 * sobrecargar AsyncStorage o exceder SQLite CursorWindow (2MB) con cadenas base64.
 */
function sanitizeTrackForPlaylist(track) {
  if (!track || !track.mediaId) return null;
  return {
    mediaId: track.mediaId,
    url: track.url,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    duration: track.duration,
    artworkUrl: track.artworkUrl && track.artworkUrl.startsWith('data:image') ? null : track.artworkUrl,
    replayGain: track.replayGain,
  };
}

/**
 * Garantiza que la lista de reproducción especial de Favoritos siempre exista
 * y se mantenga en la primera posición de la lista.
 */
function ensureFavoritesPlaylist(list) {
  if (!Array.isArray(list)) list = [];
  const favIndex = list.findIndex(
    (p) => p.id === FAVORITES_PLAYLIST_ID || p.isFavorites === true || p.name?.toLowerCase() === 'favoritos'
  );

  if (favIndex !== -1) {
    const existingFav = list[favIndex];
    const normalizedFav = {
      ...existingFav,
      id: FAVORITES_PLAYLIST_ID,
      name: FAVORITES_PLAYLIST_NAME,
      isFavorites: true,
      tracks: Array.isArray(existingFav.tracks) ? existingFav.tracks : [],
    };
    const others = list.filter((_, idx) => idx !== favIndex);
    return [normalizedFav, ...others];
  }

  const defaultFav = {
    id: FAVORITES_PLAYLIST_ID,
    name: FAVORITES_PLAYLIST_NAME,
    isFavorites: true,
    tracks: [],
  };
  return [defaultFav, ...list];
}

export default function usePlaylists(showToast) {
  const [playlists, setPlaylists] = useState(() => [
    {
      id: FAVORITES_PLAYLIST_ID,
      name: FAVORITES_PLAYLIST_NAME,
      isFavorites: true,
      tracks: [],
    },
  ]);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const stored = await AsyncStorage.getItem('vulpis_playlists');
        if (stored) {
          const parsed = JSON.parse(stored);
          const normalized = ensureFavoritesPlaylist(parsed);
          setPlaylists(normalized);
        } else {
          const initial = ensureFavoritesPlaylist([]);
          setPlaylists(initial);
          await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(initial));
        }
      } catch (err) {
        console.error('[usePlaylists] Error al cargar listas de reproducción:', err);
      }
    }
    loadPlaylists();
  }, []);

  const favoritesPlaylist = useMemo(() => {
    return playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID) || null;
  }, [playlists]);

  const isFavoriteTrack = useCallback(
    (mediaId) => {
      if (!mediaId) return false;
      const fav = playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID);
      return fav ? fav.tracks.some((t) => t.mediaId === mediaId) : false;
    },
    [playlists]
  );

  const handleToggleFavorite = useCallback(
    async (track) => {
      if (!track || !track.mediaId) return false;
      const sanitized = sanitizeTrackForPlaylist(track);
      if (!sanitized) return false;

      let isNowFavorite = false;
      const updated = playlists.map((p) => {
        if (p.id === FAVORITES_PLAYLIST_ID) {
          const exists = p.tracks.some((t) => t.mediaId === sanitized.mediaId);
          if (exists) {
            isNowFavorite = false;
            return {
              ...p,
              tracks: p.tracks.filter((t) => t.mediaId !== sanitized.mediaId),
            };
          } else {
            isNowFavorite = true;
            return {
              ...p,
              tracks: [sanitized, ...p.tracks],
            };
          }
        }
        return p;
      });

      setPlaylists(updated);
      await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));

      if (showToast) {
        if (isNowFavorite) {
          showToast('Añadida a Favoritos ❤️');
        } else {
          showToast('Eliminada de Favoritos');
        }
      }
      return isNowFavorite;
    },
    [playlists, showToast]
  );

  const handleCreatePlaylist = async (name) => {
    if (!name || name.trim() === '') return null;
    const cleanName = name.trim();
    if (cleanName.toLowerCase() === 'favoritos') {
      if (showToast) showToast('La lista de Favoritos ya existe');
      return favoritesPlaylist;
    }
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: cleanName,
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    if (showToast) showToast(`Playlist "${cleanName}" creada`);
    return newPlaylist;
  };

  const handleDeletePlaylist = async (id) => {
    if (id === FAVORITES_PLAYLIST_ID) {
      if (showToast) showToast('La lista de Favoritos no se puede eliminar');
      return;
    }
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    if (showToast) showToast('Playlist eliminada');
  };

  const handleAddTrackToPlaylist = async (playlistId, track) => {
    const sanitized = sanitizeTrackForPlaylist(track);
    if (!sanitized) return;

    let added = false;
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        if (p.tracks.some((t) => t.mediaId === sanitized.mediaId)) {
          if (showToast) {
            showToast(
              p.id === FAVORITES_PLAYLIST_ID
                ? 'La canción ya está en Favoritos'
                : 'La canción ya está en esta playlist'
            );
          }
          return p;
        }
        added = true;
        if (showToast) {
          showToast(
            p.id === FAVORITES_PLAYLIST_ID
              ? 'Añadida a Favoritos ❤️'
              : `Añadida a: ${p.name}`
          );
        }
        return {
          ...p,
          tracks: [sanitized, ...p.tracks],
        };
      }
      return p;
    });

    if (added) {
      setPlaylists(updated);
      await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId, trackId) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: p.tracks.filter((t) => t.mediaId !== trackId),
        };
      }
      return p;
    });
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    if (showToast) {
      showToast(
        playlistId === FAVORITES_PLAYLIST_ID
          ? 'Eliminada de Favoritos'
          : 'Canción eliminada de la playlist'
      );
    }
  };

  return {
    playlists,
    setPlaylists,
    favoritesPlaylist,
    isFavoriteTrack,
    handleToggleFavorite,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
  };
}

