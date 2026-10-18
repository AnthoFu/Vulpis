import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/QueueList.styles';
import { filterTrackList } from '../../hooks/useQueueList';

/**
 * Pestaña de Álbumes (Vista general y vista detallada de pistas por álbum).
 */
export default function AlbumsTab({
  displayAlbums = [],
  selectedAlbum = null,
  searchQuery = '',
  onSelectAlbum,
  onPlayAlbum,
  onBack,
  contentContainerStyle,
  ListHeaderComponent,
  renderTabs,
  renderSearchBar,
  renderGoogleDrivePanel,
  renderTrackItem,
  currentSource,
}) {
  // 2.A. Vista detallada del Álbum seleccionado
  if (selectedAlbum) {
    const filteredAlbumTracks = searchQuery
      ? filterTrackList(selectedAlbum.tracks, searchQuery, 'all')
      : selectedAlbum.tracks;

    return (
      <FlatList
        data={filteredAlbumTracks}
        keyExtractor={(item, index) => `${item.mediaId}-${index}`}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={14}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {renderTabs && renderTabs()}

            {/* Botón Volver a Álbumes */}
            <TouchableOpacity
              onPress={onBack}
              style={styles.playlistBackBtnContainer}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8F9E" />
              <Text style={styles.playlistBackBtnText}>Volver a Álbumes</Text>
            </TouchableOpacity>

            {/* Tarjeta Hero del Álbum */}
            <View style={styles.albumHeroCard}>
              <View style={styles.albumHeroArtworkContainer}>
                {selectedAlbum.artworkUrl ? (
                  <Image
                    source={{ uri: selectedAlbum.artworkUrl }}
                    style={styles.albumHeroArtworkImage}
                  />
                ) : (
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    style={styles.playlistIconWrapperGradient}
                  >
                    <MaterialCommunityIcons name="album" size={36} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              <View style={styles.albumHeroDetails}>
                <Text style={styles.albumHeroTitle} numberOfLines={2}>
                  {selectedAlbum.title}
                </Text>
                <Text style={styles.albumHeroArtist} numberOfLines={1}>
                  {selectedAlbum.artist}
                </Text>
                <Text style={styles.albumHeroCount}>
                  {selectedAlbum.trackCount}{' '}
                  {selectedAlbum.trackCount === 1 ? 'canción' : 'canciones'}
                </Text>

                <TouchableOpacity
                  onPress={() => onPlayAlbum && onPlayAlbum(selectedAlbum)}
                  disabled={selectedAlbum.tracks.length === 0}
                  style={[
                    styles.playlistHeroPlayBtn,
                    selectedAlbum.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.playlistHeroPlayBtnText}>Reproducir Álbum</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buscador dentro del Álbum */}
            {renderSearchBar && renderSearchBar()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="music-off" size={32} color="#A78BFA" />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? `Sin resultados para "${searchQuery}"` : 'Sin canciones'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) =>
          renderTrackItem && renderTrackItem(item, index, selectedAlbum.tracks, true)
        }
      />
    );
  }

  // 2.B. Lista General de Álbumes
  return (
    <FlatList
      data={displayAlbums}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={14}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          {currentSource === 'private' && renderGoogleDrivePanel && renderGoogleDrivePanel()}
          {renderSearchBar && renderSearchBar()}
          {renderTabs && renderTabs()}
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="album" size={32} color="#A78BFA" />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? `Sin álbumes para "${searchQuery}"` : 'No hay álbumes en la biblioteca'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? 'Intenta con otro término de búsqueda.'
              : 'Escanea música o importa canciones con metadatos de álbum.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.albumRow}>
          <TouchableOpacity
            onPress={() => onSelectAlbum && onSelectAlbum(item.id)}
            style={styles.albumRowMain}
            activeOpacity={0.7}
          >
            <View style={styles.albumArtworkContainer}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.albumArtworkImage} />
              ) : (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.playlistIconWrapperGradient}
                >
                  <MaterialCommunityIcons name="album" size={24} color="#FFFFFF" />
                </LinearGradient>
              )}
            </View>

            <View style={styles.albumRowDetails}>
              <Text style={styles.albumRowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.albumRowArtist} numberOfLines={1}>
                {item.artist}
              </Text>
              <Text style={styles.albumRowSub}>
                {item.trackCount} {item.trackCount === 1 ? 'canción' : 'canciones'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.playlistRowActions}>
            <TouchableOpacity
              onPress={() => onPlayAlbum && onPlayAlbum(item)}
              disabled={item.tracks.length === 0}
              style={styles.playlistPlayRowBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
