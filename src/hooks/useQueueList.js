import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image, Alert } from 'react-native';
import TrackPlayer from '@rntp/player';

export const SEARCH_FILTERS = [
  { id: 'all', label: 'Todos', icon: 'tag-multiple-outline' },
  { id: 'title', label: 'Título', icon: 'music-note-outline' },
  { id: 'artist', label: 'Artista', icon: 'account-outline' },
  { id: 'album', label: 'Álbum', icon: 'album' },
  { id: 'genre', label: 'Género', icon: 'guitar-acoustic' },
];

/**
 * Normaliza cadenas para comparaciones de búsqueda insensibles a mayúsculas y acentos.
 */
export function normalizeSearchString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Filtra una lista de canciones según el criterio y el texto de búsqueda.
 */
export function filterTrackList(list, rawQuery, filterMode = 'all') {
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

export default function useQueueList({
  tracks,
  playlists,
  currentSource,
  onSelectTrack,
  onCreatePlaylist,
  onAddTrackToPlaylist,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [isPlaylistPickerVisible, setIsPlaylistPickerVisible] = useState(false);
  const [inlineNewPlaylistName, setInlineNewPlaylistName] = useState('');

  // Restablecer selección de playlist y búsqueda al cambiar de pestaña / origen
  useEffect(() => {
    setSelectedPlaylistId(null);
    setSearchQuery('');
    setSearchFilter('all');
  }, [currentSource]);

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

  const handlePlayPlaylist = async (playlist) => {
    if (!playlist || playlist.tracks.length === 0) {
      Alert.alert('Playlist vacía', 'Añade canciones a esta playlist antes de reproducirla.');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await TrackPlayer.clear();
      await TrackPlayer.setMediaItems(playlist.tracks);
      await TrackPlayer.skipToIndex(0);
      await TrackPlayer.play();
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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const searchPlaceholder = useMemo(() => {
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
  }, [searchFilter]);

  // Filtrado reactivo e instantáneo de pistas con memoización
  const displayTracks = useMemo(() => {
    return filterTrackList(tracks, searchQuery, searchFilter);
  }, [tracks, searchQuery, searchFilter]);

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  return {
    isProcessing,
    searchQuery,
    setSearchQuery,
    searchFilter,
    setSearchFilter,
    searchFilters: SEARCH_FILTERS,
    searchPlaceholder,
    handleClearSearch,
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
