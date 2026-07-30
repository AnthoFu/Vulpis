import { useState, useEffect } from 'react';
import { Image, Alert } from 'react-native';
import TrackPlayer from '@rntp/player';

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
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [isPlaylistPickerVisible, setIsPlaylistPickerVisible] = useState(false);
  const [inlineNewPlaylistName, setInlineNewPlaylistName] = useState('');

  // Reset playlist selection when changing the source
  useEffect(() => {
    setSelectedPlaylistId(null);
    setSearchQuery('');
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

  // Filter regular tracks by search query
  const displayTracks = (tracks || []).filter((track) => {
    if (!searchQuery) return true;
    const title = (track.title || '').toLowerCase();
    const artist = (track.artist || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || artist.includes(query);
  });

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  return {
    isProcessing,
    searchQuery,
    setSearchQuery,
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
    defaultArtwork,
  };
}
