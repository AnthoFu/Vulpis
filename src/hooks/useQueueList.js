import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image, Alert } from 'react-native';
import TrackPlayer from '@rntp/player';
import {
  LIBRARY_TABS,
  buildArtistTree,
  buildAlbumList,
  filterArtists,
  filterAlbums,
} from '../utils/libraryOrganizer';

import {
  SEARCH_FILTERS,
  normalizeSearchString,
  filterTrackList,
  calculateOdooFilterCounts,
} from '../utils/trackFilter';

// Re-exportar utilidades para compatibilidad hacia atrás
export {
  SEARCH_FILTERS,
  normalizeSearchString,
  filterTrackList,
  calculateOdooFilterCounts,
};

export default function useQueueList({
  tracks,
  playlists,
  currentSource,
  onSelectTrack,
  onCreatePlaylist,
  onAddTrackToPlaylist,
  onSelectSource,
}) {
  const [activeTab, setActiveTab] = useState(
    currentSource === 'playlists' ? 'playlists' : 'songs'
  );
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [isPlaylistPickerVisible, setIsPlaylistPickerVisible] = useState(false);
  const [inlineNewPlaylistName, setInlineNewPlaylistName] = useState('');

  // Sincronizar pestaña activa cuando cambia currentSource
  useEffect(() => {
    if (currentSource === 'playlists') {
      setActiveTab('playlists');
    }
    setSelectedPlaylistId(null);
    setSelectedArtistId(null);
    setSelectedAlbumId(null);
    setSearchQuery('');
    setSearchFilter('all');
    setIsDropdownOpen(false);
  }, [currentSource]);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setSelectedArtistId(null);
    setSelectedAlbumId(null);
    setSelectedPlaylistId(null);
    setSearchQuery('');
    setSearchFilter('all');
    setIsDropdownOpen(false);

    // Sincronizar fuente si venía de playlists
    if (tabId !== 'playlists' && currentSource === 'playlists' && onSelectSource) {
      onSelectSource('local');
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text && text.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
      setSearchFilter('all');
    }
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFilter('all');
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleSelectFilter = (filterId) => {
    setSearchFilter(filterId);
    setIsDropdownOpen(false);
  };

  const selectTrack = async (item, index, playlistTracks) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (onSelectTrack) {
        await onSelectTrack(item, index, playlistTracks);
      } else {
        const trackList = playlistTracks || tracks;
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(trackList);
        await TrackPlayer.skipToIndex(index);
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useQueueList] Error al seleccionar la pista:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reproducir todas las canciones de un artista
  const handlePlayArtist = async (artist) => {
    if (!artist || !artist.tracks || artist.tracks.length === 0) {
      Alert.alert('Artista vacío', 'Este artista no tiene canciones disponibles.');
      return;
    }
    await selectTrack(artist.tracks[0], 0, artist.tracks);
  };

  // Reproducir todas las canciones de un álbum
  const handlePlayAlbum = async (album) => {
    if (!album || !album.tracks || album.tracks.length === 0) {
      Alert.alert('Álbum vacío', 'Este álbum no tiene canciones disponibles.');
      return;
    }
    await selectTrack(album.tracks[0], 0, album.tracks);
  };

  const handlePlayPlaylist = async (playlist) => {
    if (!playlist || playlist.tracks.length === 0) {
      Alert.alert('Playlist vacía', 'Añade canciones a esta playlist antes de reproducirla.');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (onSelectTrack && playlist.tracks.length > 0) {
        await onSelectTrack(playlist.tracks[0], 0, playlist.tracks);
      } else {
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(playlist.tracks);
        await TrackPlayer.skipToIndex(0);
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useQueueList] Error al reproducir la lista de reproducción:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName || newPlaylistName.trim() === '') return;
    if (onCreatePlaylist) {
      await onCreatePlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreateInput(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!inlineNewPlaylistName || inlineNewPlaylistName.trim() === '') return;
    if (onCreatePlaylist && onAddTrackToPlaylist && selectedTrackForOptions) {
      const created = await onCreatePlaylist(inlineNewPlaylistName);
      if (created) {
        await onAddTrackToPlaylist(created.id, selectedTrackForOptions);
      }
      setInlineNewPlaylistName('');
      setIsPlaylistPickerVisible(false);
      setSelectedTrackForOptions(null);
    }
  };

  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'artists') return 'Buscar por nombre de artista...';
    if (activeTab === 'albums') return 'Buscar por álbum o artista...';
    if (activeTab === 'playlists') return 'Buscar playlist...';

    switch (searchFilter) {
      case 'title':
        return 'Buscar por título de canción...';
      case 'artist':
        return 'Buscar por nombre de artista...';
      case 'album':
        return 'Buscar por álbum...';
      case 'genre':
        return 'Buscar por género musical...';
      case 'all':
      default:
        return 'Buscar canción, artista, álbum o género...';
    }
  }, [activeTab, searchFilter]);

  // Contexto activo de canciones para calcular coincidencias
  const activeContextTracks = useMemo(() => {
    if (activeTab === 'playlists') {
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      return pl ? pl.tracks : [];
    }
    if (activeTab === 'artists' && selectedArtistId) {
      const art = buildArtistTree(tracks).find((a) => a.id === selectedArtistId);
      return art ? art.tracks : [];
    }
    if (activeTab === 'albums' && selectedAlbumId) {
      const alb = buildAlbumList(tracks).find((al) => al.id === selectedAlbumId);
      return alb ? alb.tracks : [];
    }
    return tracks || [];
  }, [activeTab, selectedPlaylistId, playlists, selectedArtistId, selectedAlbumId, tracks]);

  // Conteo reactivo por categoría estilo Odoo para las sugerencias del buscador
  const filterCounts = useMemo(() => {
    return calculateOdooFilterCounts(activeContextTracks, searchQuery);
  }, [activeContextTracks, searchQuery]);

  // Filtrado reactivo de canciones con memoización
  const displayTracks = useMemo(() => {
    return filterTrackList(tracks, searchQuery, searchFilter);
  }, [tracks, searchQuery, searchFilter]);

  // Árbol de Artistas y lista de Álbumes calculados reactivamente
  const artistTree = useMemo(() => {
    return buildArtistTree(tracks);
  }, [tracks]);

  const albumList = useMemo(() => {
    return buildAlbumList(tracks);
  }, [tracks]);

  // Artistas y Álbumes filtrados con el buscador activo
  const displayArtists = useMemo(() => {
    return filterArtists(artistTree, searchQuery);
  }, [artistTree, searchQuery]);

  const displayAlbums = useMemo(() => {
    return filterAlbums(albumList, searchQuery);
  }, [albumList, searchQuery]);

  // Artista y Álbum seleccionados actualmente
  const selectedArtist = useMemo(() => {
    if (!selectedArtistId) return null;
    return artistTree.find((a) => a.id === selectedArtistId) || null;
  }, [artistTree, selectedArtistId]);

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumId) return null;
    return albumList.find((alb) => alb.id === selectedAlbumId) || null;
  }, [albumList, selectedAlbumId]);

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  return {
    activeTab,
    handleTabChange,
    tabs: LIBRARY_TABS,
    artistTree,
    displayArtists,
    selectedArtistId,
    setSelectedArtistId,
    selectedArtist,
    handlePlayArtist,
    albumList,
    displayAlbums,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedAlbum,
    handlePlayAlbum,
    isProcessing,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    searchFilter,
    setSearchFilter,
    handleSelectFilter,
    searchFilters: SEARCH_FILTERS,
    searchPlaceholder,
    handleClearSearch,
    isDropdownOpen,
    setIsDropdownOpen,
    toggleDropdown,
    filterCounts,
    selectedPlaylistId,
    setSelectedPlaylistId,
    showCreateInput,
    setShowCreateInput,
    newPlaylistName,
    setNewPlaylistName,
    selectedTrackForOptions,
    setSelectedTrackForOptions,
    isPlaylistPickerVisible,
    setIsPlaylistPickerVisible,
    inlineNewPlaylistName,
    setInlineNewPlaylistName,
    selectTrack,
    handlePlayPlaylist,
    handleCreateNewPlaylist,
    handleCreateAndAdd,
    displayTracks,
    filterTrackList,
    defaultArtwork,
  };
}
