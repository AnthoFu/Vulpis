import React from 'react';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/QueueList.styles';

/**
 * Renderiza la carátula o gradiente identificador de una lista de reproducción.
 */
export function renderPlaylistArtwork(playlist) {
  if (!playlist) return null;
  const isFav = playlist.id === 'favorites' || playlist.isFavorites;
  if (isFav) {
    return (
      <LinearGradient
        colors={['#EF4444', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.playlistIconWrapperGradient}
      >
        <MaterialCommunityIcons name="heart" size={24} color="#FFFFFF" />
      </LinearGradient>
    );
  }

  const firstTrackWithArtwork = playlist.tracks?.find((t) => t.artworkUrl);
  if (firstTrackWithArtwork) {
    return (
      <Image
        source={{ uri: firstTrackWithArtwork.artworkUrl }}
        style={styles.playlistArtworkImage}
      />
    );
  }
  return (
    <LinearGradient
      colors={['#8B5CF6', '#EC4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.playlistIconWrapperGradient}
    >
      <MaterialCommunityIcons name="music-box-multiple" size={24} color="#FFFFFF" />
    </LinearGradient>
  );
}

export default function PlaylistArtwork({ playlist }) {
  return renderPlaylistArtwork(playlist);
}
