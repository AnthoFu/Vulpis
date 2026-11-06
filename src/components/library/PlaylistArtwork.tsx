import React from 'react';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/QueueList.styles';
import { Playlist } from '../../models/Playlist';

/**
 * Renderiza la carátula o gradiente identificador de una lista de reproducción.
 */
export function renderPlaylistArtwork(playlist?: Playlist | null): React.JSX.Element | null {
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
  if (firstTrackWithArtwork && firstTrackWithArtwork.artworkUrl) {
    return (
      <Image
        source={{ uri: firstTrackWithArtwork.artworkUrl }}
        style={styles.playlistArtworkImage as any}
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

export interface PlaylistArtworkProps {
  playlist?: Playlist | null;
}

export default function PlaylistArtwork({ playlist }: PlaylistArtworkProps): React.JSX.Element | null {
  return renderPlaylistArtwork(playlist);
}
