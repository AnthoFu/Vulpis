import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import TrackPlayer from '@rntp/player';

export default function QueueList({ activeTrack, tracks, ListHeaderComponent, contentContainerStyle, isLoading }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const selectTrack = async (index) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      console.log(`Selecting track at index: ${index}`);
      await TrackPlayer.skipToIndex(index);
      await TrackPlayer.play();
    } catch (e) {
      console.error('Error selecting track:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayTracks = tracks || [];

  return (
    <FlatList
      data={isLoading ? [] : displayTracks}
      keyExtractor={(item) => item.mediaId}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          <Text style={styles.queueHeader}>SIGUIENTE EN COLA</Text>
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Conectando con la nube...</Text>
            </View>
          )}
        </>
      }
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => {
        const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : index === 0;
        return (
          <TouchableOpacity
            disabled={isProcessing}
            onPress={() => selectTrack(index)}
            style={[
              styles.queueItem,
              isCurrent && styles.queueItemActive,
              isProcessing && styles.queueItemDisabled,
            ]}
          >
            <Image source={{ uri: item.artworkUrl }} style={styles.queueArtwork} />
            <View style={styles.queueDetails}>
              <Text
                style={[
                  styles.queueTitle,
                  isCurrent && styles.queueTextActive,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.queueArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            {isCurrent && (
              <View style={styles.playingIndicator}>
                <Text style={styles.playingIndicatorText}>SONANDO</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  queueHeader: {
    color: '#5F6070',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
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
  queueItemDisabled: {
    opacity: 0.5,
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
  loadingWrapper: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#5F6070',
    fontSize: 13,
    marginTop: 12,
  },
});
