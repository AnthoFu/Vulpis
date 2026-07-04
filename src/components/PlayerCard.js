import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer from '@rntp/player';
import ProgressBar from './ProgressBar';
import Controls from './Controls';

export default function PlayerCard({
  activeTrack,
  isPlaying,
  position,
  duration,
  repeatMode,
  isShuffleActive,
  tracks,
  playQueue,
  onRemoveFromQueue,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const defaultTrack = tracks && tracks.length > 0 ? tracks[0] : { title: 'No Track', artist: 'No Artist', artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80' };
  
  const currentTrackTitle = activeTrack?.title ?? defaultTrack.title;
  const currentTrackArtist = activeTrack?.artist ?? defaultTrack.artist;
  const currentTrackArtwork = activeTrack?.artworkUrl ?? defaultTrack.artworkUrl;

  const selectTrackFromQueue = async (index) => {
    try {
      console.log(`[PlayerCard Queue] Skipping to index: ${index}`);
      await TrackPlayer.skipToIndex(index);
      await TrackPlayer.play();
    } catch (e) {
      console.error('[PlayerCard Queue] Error skipping to index:', e);
    }
  };

  // If the internal Queue overlay is visible, render it
  if (isQueueVisible) {
    return (
      <View
        style={[
          styles.playerFullScreen,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setIsQueueVisible(false)} style={styles.closeButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COLA DE REPRODUCCIÓN</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        
        {/* Queue Scrollable List */}
        <FlatList
          data={playQueue || []}
          keyExtractor={(item, index) => `${item.mediaId}-${index}`}
          contentContainerStyle={styles.queueListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
            return (
              <View style={[styles.queueItem, isCurrent && styles.queueItemActive]}>
                <TouchableOpacity
                  onPress={() => selectTrackFromQueue(index)}
                  style={styles.queueItemMainContent}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.artworkUrl || defaultTrack.artworkUrl }} style={styles.queueArtwork} />
                  <View style={styles.queueDetails}>
                    <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isCurrent ? (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingIndicatorText}>SONANDO</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => onRemoveFromQueue && onRemoveFromQueue(item, index)}
                    style={styles.removeButton}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      </View>
    );
  }

  // Normal Fullscreen Player view
  return (
    <View
      style={[
        styles.playerFullScreen,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SONANDO AHORA</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Artwork Section with Shadow wrapper */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkShadowWrapper}>
          <Image
            source={{ uri: currentTrackArtwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        </View>
      </View>
      
      {/* Track Details, Progress & Controls */}
      <View style={styles.bottomSection}>
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrackTitle}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrackArtist}
          </Text>
        </View>

        <ProgressBar position={position} duration={duration} />
        
        <Controls
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          isShuffleActive={isShuffleActive}
        />

        {/* Footer controls button */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={styles.footerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={22} color="#8E8F9E" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Ver Cola de Reproducción</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerFullScreen: {
    flex: 1,
    backgroundColor: '#090A0F',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    width: '100%',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2D3C',
  },
  headerTitle: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  artworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  artworkShadowWrapper: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#161722',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  bottomSection: {
    width: '100%',
    marginBottom: 8,
  },
  trackDetails: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  trackArtist: {
    color: '#8E8F9E',
    fontSize: 16,
    fontWeight: '500',
  },
  footerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#161722',
    borderWidth: 1,
    borderColor: '#2C2D3C',
  },
  footerButtonText: {
    color: '#8E8F9E',
    fontSize: 13,
    fontWeight: '600',
  },
  queueListContent: {
    paddingVertical: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#12131A',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  queueItemActive: {
    backgroundColor: '#1C1D2A',
    borderColor: '#3B3D54',
  },
  queueItemMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  queueArtwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 14,
  },
  queueDetails: {
    flex: 1,
  },
  queueTitle: {
    color: '#E2E3E9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  queueTextActive: {
    color: '#8B5CF6',
  },
  queueArtist: {
    color: '#8E8F9E',
    fontSize: 13,
  },
  playingIndicator: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  playingIndicatorText: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});


