import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Playlist,
  FAVORITES_PLAYLIST_ID,
  FAVORITES_PLAYLIST_NAME,
  ensureFavoritesPlaylist,
  sanitizePlaylistsForStorage,
} from '../models/Playlist';
import { Track, sanitizeTrackForStorage } from '../models/Track';
import {
  exportPlaylistFile,
  importPlaylistFile,
  PlaylistExportFormat,
} from '../services/playlist';

export { FAVORITES_PLAYLIST_ID, FAVORITES_PLAYLIST_NAME };

export interface UsePlaylistsReturn {
  playlists: Playlist[];
  setPlaylists: Dispatch<SetStateAction<Playlist[]>>;
  favoritesPlaylist: Playlist | null;
  isFavoriteTrack: (mediaId?: string | null) => boolean;
  handleToggleFavorite: (track?: Track | null) => Promise<boolean>;
  handleCreatePlaylist: (name: string) => Promise<Playlist | null>;
  handleDeletePlaylist: (id: string) => Promise<void>;
  handleAddTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  handleRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  handleUpdateTrackInPlaylists: (mediaId: string, updatedFields: Partial<Track>) => Promise<void>;
  handleUpdatePlaylist: (updatedPlaylist: Playlist) => Promise<void>;
  handleExportPlaylist: (playlist: Playlist, format: PlaylistExportFormat) => Promise<boolean>;
  handleImportPlaylist: () => Promise<Playlist | null>;
}

export default function usePlaylists(showToast?: (message: string) => void): UsePlaylistsReturn {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => [
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
          const parsed = JSON.parse(stored) as Playlist[];
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

  const favoritesPlaylist = useMemo<Playlist | null>(() => {
    return playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID) || null;
  }, [playlists]);

  const isFavoriteTrack = useCallback(
    (mediaId?: string | null): boolean => {
      if (!mediaId) return false;
      const fav = playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID);
      return fav ? fav.tracks.some((t) => t.mediaId === mediaId) : false;
    },
    [playlists]
  );

  const handleToggleFavorite = useCallback(
    async (track?: Track | null): Promise<boolean> => {
      if (!track || !track.mediaId) return false;
      const sanitized = sanitizeTrackForStorage(track);
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
      await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));

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

  const handleCreatePlaylist = async (name: string): Promise<Playlist | null> => {
    if (!name || name.trim() === '') return null;
    const cleanName = name.trim();
    if (cleanName.toLowerCase() === 'favoritos') {
      if (showToast) showToast('La lista de Favoritos ya existe');
      return favoritesPlaylist;
    }
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: cleanName,
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));
    if (showToast) showToast(`Playlist "${cleanName}" creada`);
    return newPlaylist;
  };

  const handleDeletePlaylist = async (id: string): Promise<void> => {
    if (id === FAVORITES_PLAYLIST_ID) {
      if (showToast) showToast('La lista de Favoritos no se puede eliminar');
      return;
    }
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));
    if (showToast) showToast('Playlist eliminada');
  };

  const handleAddTrackToPlaylist = async (playlistId: string, track: Track): Promise<void> => {
    const sanitized = sanitizeTrackForStorage(track);
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
      await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<void> => {
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
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));
    if (showToast) {
      showToast(
        playlistId === FAVORITES_PLAYLIST_ID
          ? 'Eliminada de Favoritos'
          : 'Canción eliminada de la playlist'
      );
    }
  };

  const handleUpdateTrackInPlaylists = async (
    mediaId: string,
    updatedFields: Partial<Track>
  ): Promise<void> => {
    setPlaylists((prev) => {
      const next = prev.map((p) => ({
        ...p,
        tracks: p.tracks.map((t) => (t.mediaId === mediaId ? { ...t, ...updatedFields } : t)),
      }));
      AsyncStorage.setItem(
        'vulpis_playlists',
        JSON.stringify(sanitizePlaylistsForStorage(next))
      ).catch((e) => console.error('[usePlaylists] Error guardando listas tras edición de etiquetas:', e));
      return next;
    });
  };

  const handleUpdatePlaylist = async (updatedPlaylist: Playlist): Promise<void> => {
    setPlaylists((prev) => {
      const next = prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p));
      AsyncStorage.setItem(
        'vulpis_playlists',
        JSON.stringify(sanitizePlaylistsForStorage(next))
      ).catch((e) => console.error('[usePlaylists] Error guardando lista actualizada:', e));
      return next;
    });
  };

  const handleExportPlaylist = async (
    playlist: Playlist,
    format: PlaylistExportFormat = 'm3u'
  ): Promise<boolean> => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
      if (showToast) showToast('No se puede exportar una lista vacía');
      return false;
    }
    const result = await exportPlaylistFile(playlist, format);
    if (result.success) {
      if (showToast) showToast(`Playlist "${playlist.name}" exportada (${format.toUpperCase()})`);
      return true;
    } else {
      if (showToast) showToast(result.error || 'Error al exportar playlist');
      return false;
    }
  };

  const handleImportPlaylist = async (): Promise<Playlist | null> => {
    try {
      const imported = await importPlaylistFile();
      if (!imported) return null;

      if (!imported.tracks || imported.tracks.length === 0) {
        if (showToast) showToast('El archivo no contiene canciones válidas');
        return null;
      }

      // Evitar colisiones de nombres con listas existentes
      let finalName = imported.name;
      let counter = 1;
      while (playlists.some((p) => p.name.toLowerCase() === finalName.toLowerCase())) {
        finalName = `${imported.name} (${counter++})`;
      }

      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name: finalName,
        tracks: imported.tracks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updated = [...playlists, newPlaylist];
      setPlaylists(updated);
      await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(sanitizePlaylistsForStorage(updated)));

      if (showToast) {
        showToast(`Playlist "${finalName}" importada (${imported.tracks.length} canciones)`);
      }
      return newPlaylist;
    } catch (err) {
      console.error('[usePlaylists] Error al importar playlist:', err);
      if (showToast) showToast('Error al importar la lista de reproducción');
      return null;
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
    handleUpdateTrackInPlaylists,
    handleUpdatePlaylist,
    handleExportPlaylist,
    handleImportPlaylist,
  };
}
