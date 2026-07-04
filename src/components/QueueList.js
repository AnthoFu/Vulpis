import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';

export default function QueueList({
  activeTrack,
  tracks,
  playQueue,
  ListHeaderComponent,
  contentContainerStyle,
  isLoading,
  currentSource,
  onScanLocal,
  onImportMp3,
  onResetLocal,
  hasCustomLocalTracks,
  onAddToQueue,
  onRemoveFromQueue,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'queue'

  const selectTrack = async (item, index) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (activeTab === 'queue') {
        console.log(`Selecting track from queue at index: ${index}`);
        await TrackPlayer.skipToIndex(index);
        await TrackPlayer.play();
      } else {
        const originalIndex = (tracks || []).findIndex(t => t.mediaId === item.mediaId);
        if (originalIndex !== -1) {
          console.log(`Selecting track at original index: ${originalIndex}`);
          await TrackPlayer.skipToIndex(originalIndex);
          await TrackPlayer.play();
        } else {
          console.warn('Track not found in current queue:', item.mediaId);
        }
      }
    } catch (e) {
      console.error('Error selecting track:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter library tracks based on search query
  const displayTracks = (tracks || []).filter((track) => {
    if (!searchQuery) return true;
    const title = (track.title || '').toLowerCase();
    const artist = (track.artist || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || artist.includes(query);
  });

  const listData = activeTab === 'library' 
    ? (isLoading ? [] : displayTracks) 
    : playQueue;

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => `${item.mediaId}-${index}`}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}

          {/* Tabs Selector */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('library');
                setSearchQuery('');
              }}
              style={[styles.tabButton, activeTab === 'library' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === 'library' && styles.tabLabelActive]}>
                Biblioteca
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('queue')}
              style={[styles.tabButton, activeTab === 'queue' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === 'queue' && styles.tabLabelActive]}>
                Cola de reproducción
              </Text>
            </TouchableOpacity>
          </View>

          {/* Render Library elements ONLY when library tab is active */}
          {activeTab === 'library' && (
            <>
              {/* Search Bar Component */}
              <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#8E8F9E" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar en la biblioteca..."
                    placeholderTextColor="#5F6070"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#8E8F9E" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Local Library Action Buttons */}
              {currentSource === 'local' && (
                <View style={styles.localActionsRow}>
                  <TouchableOpacity
                    onPress={onScanLocal}
                    style={styles.actionButton}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="folder-music" size={18} color="#A78BFA" />
                    <Text style={styles.actionButtonText}>Escanear Audio</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onImportMp3}
                    style={styles.actionButton}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="file-plus" size={18} color="#A78BFA" />
                    <Text style={styles.actionButtonText}>Importar MP3</Text>
                  </TouchableOpacity>

                  {hasCustomLocalTracks && (
                    <TouchableOpacity
                      onPress={onResetLocal}
                      style={[styles.actionButton, styles.resetButton]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="restore" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          <Text style={styles.queueHeader}>
            {activeTab === 'library' 
              ? (searchQuery ? `RESULTADOS DE BÚSQUEDA (${displayTracks.length})` : 'CANCIONES DISPONIBLES') 
              : 'COLA ACTUAL DE REPRODUCCIÓN'}
          </Text>

          {isLoading && activeTab === 'library' && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Conectando con la fuente...</Text>
            </View>
          )}

          {!isLoading && activeTab === 'library' && displayTracks.length === 0 && (
            <View style={styles.emptyWrapper}>
              <MaterialCommunityIcons name="music-off" size={48} color="#3F4052" />
              <Text style={styles.emptyText}>No se encontraron canciones</Text>
              {currentSource === 'local' && !searchQuery && (
                <Text style={styles.emptySubText}>Usa "Escanear Audio" o "Importar MP3" para cargar música local.</Text>
              )}
            </View>
          )}

          {activeTab === 'queue' && (playQueue || []).length === 0 && (
            <View style={styles.emptyWrapper}>
              <MaterialCommunityIcons name="playlist-remove" size={48} color="#3F4052" />
              <Text style={styles.emptyText}>La cola está vacía</Text>
              <Text style={styles.emptySubText}>Añade canciones a la cola desde la Biblioteca.</Text>
            </View>
          )}
        </>
      }
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => {
        const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
        return (
          <View
            style={[
              styles.queueItem,
              isCurrent && styles.queueItemActive,
              isProcessing && styles.queueItemDisabled,
            ]}
          >
            <TouchableOpacity
              disabled={isProcessing}
              onPress={() => selectTrack(item, index)}
              style={styles.itemMainContent}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.artworkUrl || defaultArtwork }} style={styles.queueArtwork} />
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
            </TouchableOpacity>

            {isCurrent ? (
              <View style={styles.playingIndicator}>
                <Text style={styles.playingIndicatorText}>SONANDO</Text>
              </View>
            ) : (
              activeTab === 'library' ? (
                <TouchableOpacity
                  onPress={() => onAddToQueue && onAddToQueue(item)}
                  style={styles.addToQueueButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="playlist-plus" size={24} color="#A78BFA" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => onRemoveFromQueue && onRemoveFromQueue(item, index)}
                  style={styles.addToQueueButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
                </TouchableOpacity>
              )
            )}
          </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#12131A',
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F202E',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1C1D2A',
    borderWidth: 1,
    borderColor: '#3B3D54',
  },
  tabLabel: {
    color: '#8E8F9E',
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchSection: {
    marginTop: 4,
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F202E',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#E2E3E9',
    fontSize: 14,
    height: '100%',
  },
  localActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    color: '#E2E3E9',
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    flex: 0,
    width: 44,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
  itemMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addToQueueButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  emptyWrapper: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: '#8E8F9E',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubText: {
    color: '#5F6070',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
});
