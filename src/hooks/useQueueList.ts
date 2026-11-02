import { useState, useEffect, useMemo, useCallback } from 'react';
import { Image, Alert } from 'react-native';
import TrackPlayer from '@rntp/player';
import {
  LIBRARY_TABS,
  buildArtistTree,
  buildAlbumList,
  filterArtists,
  filterAlbums,
  ArtistNode,
  AlbumNode,
  LibraryTabItem,
} from '../utils/libraryOrganizer';

import {
  SEARCH_FILTERS,
  normalizeSearchString,
  filterTrackList,
  calculateOdooFilterCounts,
  SearchFilterId,
  SearchFilterOption,
  OdooFilterCounts,
} from '../utils/trackFilter';
import { Track } from '../models/Track';
import { Playlist } from '../models/Playlist';

// Re-exportar utilidades para compatibilidad hacia atrás
export {
  SEARCH_FILTERS,
  normalizeSearchString,
  filterTrackList,
  calculateOdooFilterCounts,
};

export interface UseQueueListParams {
  tracks: Track[];
  playlists: Playlist[];
  currentSource: string;
  onSelectTrack?: (track: Track, index: number, playlistTracks?: Track[]) => Promise<void> | void;
  onCreatePlaylist?: (name: string) => Promise<Playlist | null>;
  onAddTrackToPlaylist?: (playlistId: string, track: Track) => Promise<void>;
  onSelectSource?: (source: string) => void;
}

export interface UseQueueListReturn {
  activeTab: string;
  handleTabChange: (tabId: string) => void;
  tabs: LibraryTabItem[];
  artistTree: ArtistNode[];
  displayArtists: ArtistNode[];
  selectedArtistId: string | null;
  setSelectedArtistId: (id: string | null) => void;
  selectedArtist: ArtistNode | null;
  handlePlayArtist: (artist: ArtistNode) => Promise<void>;
  albumList: AlbumNode[];
  displayAlbums: AlbumNode[];
  selectedAlbumId: string | null;
  setSelectedAlbumId: (id: string | null) => void;
  selectedAlbum: AlbumNode | null;
  handlePlayAlbum: (album: AlbumNode) => Promise<void>;
  isProcessing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchChange: (text: string) => void;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  handleSelectFilter: (filterId: string) => void;
  searchFilters: SearchFilterOption[];
  searchPlaceholder: string;
  handleClearSearch: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleDropdown: () => void;
  filterCounts: OdooFilterCounts;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  showCreateInput: boolean;
  setShowCreateInput: (show: boolean) => void;
  newPlaylistName: string;
  setNewPlaylistName: (name: string) => void;
  selectedTrackForOptions: Track | null;
  setSelectedTrackForOptions: (track: Track | null) => void;
  isPlaylistPickerVisible: boolean;
  setIsPlaylistPickerVisible: (visible: boolean) => void;
  inlineNewPlaylistName: string;
  setInlineNewPlaylistName: (name: string) => void;
  selectTrack: (item: Track, index: number, playlistTracks?: Track[]) => Promise<void>;
  handlePlayPlaylist: (playlist: Playlist) => Promise<void>;
  handleCreateNewPlaylist: () => Promise<void>;
  handleCreateAndAdd: () => Promise<void>;
  displayTracks: Track[];
  filterTrackList: typeof filterTrackList;
  defaultArtwork: string;
}

export default function useQueueList({
  tracks,
  playlists,
  currentSource,
  onSelectTrack,
  onCreatePlaylist,
  onAddTrackToPlaylist,
  onSelectSource,
}: UseQueueListParams): UseQueueListReturn {
  const [activeTab, setActiveTab] = useState(
    currentSource === 'playlists' ? 'playlists' : 'songs'
  );
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilterId | string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
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

  const handleTabChange = (tabId: string): void => {
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

  const handleSearchChange = (text: string): void => {
    setSearchQuery(text);
    if (text && text.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
      setSearchFilter('all');
    }
  };

  const handleClearSearch = useCallback((): void => {
    setSearchQuery('');
    setSearchFilter('all');
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback((): void => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleSelectFilter = (filterId: string): void => {
    setSearchFilter(filterId);
    setIsDropdownOpen(false);
  };

  const selectTrack = async (item: Track, index: number, playlistTracks?: Track[]): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (onSelectTrack) {
        await onSelectTrack(item, index, playlistTracks);
      } else {
        const trackList = playlistTracks || tracks;
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(trackList as any);
        await TrackPlayer.skipToIndex(index);
        TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useQueueList] Error al seleccionar la pista:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reproducir todas las canciones de un artista
  const handlePlayArtist = async (artist: ArtistNode): Promise<void> => {
    if (!artist || !artist.tracks || artist.tracks.length === 0) {
      Alert.alert('Artista vacío', 'Este artista no tiene canciones disponibles.');
      return;
    }
    await selectTrack(artist.tracks[0], 0, artist.tracks);
  };

  // Reproducir todas las canciones de un álbum
  const handlePlayAlbum = async (album: AlbumNode): Promise<void> => {
    if (!album || !album.tracks || album.tracks.length === 0) {
      Alert.alert('Álbum vacío', 'Este álbum no tiene canciones disponibles.');
      return;
    }
    await selectTrack(album.tracks[0], 0, album.tracks);
  };

  const handlePlayPlaylist = async (playlist: Playlist): Promise<void> => {
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
        await TrackPlayer.setMediaItems(playlist.tracks as any);
        await TrackPlayer.skipToIndex(0);
        TrackPlayer.play();
      }
    } catch (e) {
      console.error('[useQueueList] Error al reproducir la lista de reproducción:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewPlaylist = async (): Promise<void> => {
    if (!newPlaylistName || newPlaylistName.trim() === '') return;
    if (onCreatePlaylist) {
      await onCreatePlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreateInput(false);
    }
  };

  const handleCreateAndAdd = async (): Promise<void> => {
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
