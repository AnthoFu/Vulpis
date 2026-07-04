import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MiniPlayer({ activeTrack, isPlaying, position, duration, onPress }) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeTrack) return null;

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[MiniPlayer] Error toggling playback:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (e) {
      console.log('[MiniPlayer] No previous track:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (e) {
      console.log('[MiniPlayer] No next track:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const currentArtwork = activeTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        { bottom: insets.bottom + 8 }
      ]}
    >
      {/* Sleek top progress indicator */}
      <View style={styles.progressBackground}>
        <View style={[styles.progressActive, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        {/* Track Artwork */}
        <Image source={{ uri: currentArtwork }} style={styles.artwork} />

        {/* Track Details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {activeTrack.title || 'Sin Título'}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {activeTrack.artist || 'Artista Desconocido'}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={playPrevious}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="skip-previous" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayback}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playNext}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="skip-next" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: '#161722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // To clip the top progress bar corners correctly
  },
  progressBackground: {
    height: 2,
    width: '100%',
    backgroundColor: '#232433',
  },
  progressActive: {
    height: 2,
    backgroundColor: '#8B5CF6',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#232433',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#8E8F9E',
    fontSize: 12,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
