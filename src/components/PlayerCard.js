import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer from '@rntp/player';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
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
  onSelectTrack,
}) {
  const insets = useSafeAreaInsets();
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const defaultTrack = tracks && tracks.length > 0 ? tracks[0] : { title: 'No Track', artist: 'No Artist', artworkUrl: defaultCover };
  
  const currentTrackTitle = activeTrack?.title ?? defaultTrack.title;
  const currentTrackArtist = activeTrack?.artist ?? defaultTrack.artist;
  const currentTrackArtwork = activeTrack?.artworkUrl ?? defaultTrack.artworkUrl;

  const [colorA, setColorA] = useState('#161722');
  const [colorB, setColorB] = useState('#161722');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    
    const fetchColors = async () => {
      if (!currentTrackArtwork) return;
      try {
        const result = await ImageColors.getColors(currentTrackArtwork, {
          fallback: '#161722',
          cache: true,
          key: currentTrackArtwork,
        });

        let newColor = '#161722';
        if (result.type === 'android') {
          newColor = result.dominant || result.vibrant || result.darkVibrant || '#161722';
        } else if (result.type === 'ios') {
          newColor = result.primary || result.background || '#161722';
        } else if (result.type === 'web') {
          newColor = result.dominant || '#161722';
        }

        if (isMounted) {
          setColorB(newColor);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            if (isMounted) {
              setColorA(newColor);
              fadeAnim.setValue(0);
            }
          });
        }
      } catch (e) {
        console.error('Error fetching image colors:', e);
      }
    };

    fetchColors();

    return () => {
      isMounted = false;
    };
  }, [currentTrackArtwork]);

  const selectTrackFromQueue = async (index) => {
    try {
      console.log(`[PlayerCard Queue] Skipping to index: ${index}`);
      await TrackPlayer.skipToIndex(index);
      await TrackPlayer.play();
    } catch (e) {
      console.error('[PlayerCard Queue] Error skipping to index:', e);
    }
  };

  const renderBackground = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Layer A (Base / Prev Color) */}
        <LinearGradient
          colors={[colorA, '#090A0F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Layer B (Target Color, Fading In) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colorB, '#090A0F']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        {/* Dark overlay to ensure text is always readable */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 10, 15, 0.4)' }]} />
      </View>
    );
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
        {renderBackground()}
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
      {renderBackground()}
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
          tracks={tracks}
          playQueue={playQueue}
          activeTrack={activeTrack}
          onSelectTrack={onSelectTrack}
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    width: '100%',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 23, 34, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(44, 45, 60, 0.6)',
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
    zIndex: 10,
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
    zIndex: 10,
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
    color: '#E2E3E9',
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
    backgroundColor: 'rgba(22, 23, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(44, 45, 60, 0.6)',
  },
  footerButtonText: {
    color: '#8E8F9E',
    fontSize: 13,
    fontWeight: '600',
  },
  queueListContent: {
    paddingVertical: 12,
    zIndex: 10,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 19, 26, 0.6)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  queueItemActive: {
    backgroundColor: 'rgba(28, 29, 42, 0.7)',
    borderColor: 'rgba(59, 61, 84, 0.7)',
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


