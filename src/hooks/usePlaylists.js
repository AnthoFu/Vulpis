import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function usePlaylists(showToast) {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const stored = await AsyncStorage.getItem('vulpis_playlists');
        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      } catch (err) {
        console.error('[usePlaylists] Error al cargar listas de reproducción:', err);
      }
    }
    loadPlaylists();
  }, []);

  const handleCreatePlaylist = async (name) => {
    if (!name || name.trim() === '') return null;
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    showToast(`Playlist "${name}" creada`);
    return newPlaylist;
  };

  const handleDeletePlaylist = async (id) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
    showToast('Playlist eliminada');
  };

  const handleAddTrackToPlaylist = async (playlistId, track) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        if (p.tracks.some((t) => t.mediaId === track.mediaId)) {
          showToast('La canción ya está en esta playlist');
          return p;
        }
        showToast(`Añadida a: ${p.name}`);
        return {
          ...p,
          tracks: [...p.tracks, track],
        };
      }
      return p;
    });
    setPlaylists(updated);
    await AsyncStorage.setItem('vulpis_playlists', JSON.stringify(updated));
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
    showToast('Canción eliminada de la playlist');
  };

  return {
    playlists,
    setPlaylists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
  };
}
