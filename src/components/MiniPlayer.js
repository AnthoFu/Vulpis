import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MiniPlayer({
  activeTrack,
  isPlaying,
  position,
  duration,
  onPress,
  tracks = [],
  playQueue = [],
  onSelectTrack,
  isShuffleActive,
}) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeTrack) return null;

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[MiniPlayer] Error toggling playback:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playLibraryFallback = async (direction) => {
    try {
      if (tracks && tracks.length > 0 && onSelectTrack) {
        let targetIndex = 0;
        if (isShuffleActive) {
          targetIndex = Math.floor(Math.random() * tracks.length);
        } else if (activeTrack) {
          const currentIdx = tracks.findIndex(t => t.mediaId === activeTrack.mediaId);
          if (currentIdx !== -1) {
            if (direction === 'next') {
              targetIndex = (currentIdx + 1) % tracks.length;
            } else {
              targetIndex = (currentIdx - 1 + tracks.length) % tracks.length;
            }
          }
        }
        const targetTrack = tracks[targetIndex];
        if (targetTrack) {
          console.log(`[MiniPlayer] Skipping fallback to library track: ${targetTrack.title}`);
          await onSelectTrack(targetTrack, targetIndex);
        }
      } else {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      }
    } catch (fallbackErr) {
      console.error('[MiniPlayer] Error in playLibraryFallback:', fallbackErr);
      try {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } catch (err) {
        console.error('[MiniPlayer] Absolute fallback failed:', err);
      }
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[MiniPlayer] Skipping to previous track in queue');
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else {
        console.log('[MiniPlayer] Queue has 1 or fewer tracks, triggering library fallback');
        await playLibraryFallback('prev');
      }
    } catch (e) {
      console.log('[MiniPlayer] No previous track:', e);
      await playLibraryFallback('prev');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[MiniPlayer] Skipping to next track in queue');
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else {
        console.log('[MiniPlayer] Queue has 1 or fewer tracks, triggering library fallback');
        await playLibraryFallback('next');
      }
    } catch (e) {
      console.log('[MiniPlayer] No next track:', e);
      await playLibraryFallback('next');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const currentArtwork = activeTrack.artworkUrl || defaultCover;

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
