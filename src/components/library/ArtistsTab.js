import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/QueueList.styles';
import { filterTrackList } from '../../hooks/useQueueList';

/**
 * Pestaña de Árbol de Artistas (Vista general y vista detallada de artista).
 */
export default function ArtistsTab({
  displayArtists = [],
  selectedArtist = null,
  searchQuery = '',
  onSelectArtist,
  onPlayArtist,
  onBack,
  contentContainerStyle,
  ListHeaderComponent,
  renderTabs,
  renderSearchBar,
  renderGoogleDrivePanel,
  renderTrackItem,
  currentSource,
}) {
  // 1.A. Vista detallada del Artista seleccionado
  if (selectedArtist) {
    const filteredArtistTracks = searchQuery
      ? filterTrackList(selectedArtist.tracks, searchQuery, 'all')
      : selectedArtist.tracks;

    return (
      <FlatList
        data={filteredArtistTracks}
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

            {/* Botón Volver a Artistas */}
            <TouchableOpacity
              onPress={onBack}
              style={styles.playlistBackBtnContainer}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8F9E" />
              <Text style={styles.playlistBackBtnText}>Volver a Artistas</Text>
            </TouchableOpacity>

            {/* Tarjeta Hero del Artista */}
            <View style={styles.artistHeroCard}>
              <View style={styles.artistHeroAvatarContainer}>
                {selectedArtist.artworkUrl ? (
                  <Image
                    source={{ uri: selectedArtist.artworkUrl }}
                    style={styles.artistHeroAvatarImage}
                  />
                ) : (
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1']}
                    style={styles.artistAvatarFallback}
                  >
                    <MaterialCommunityIcons name="account-music" size={36} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              <View style={styles.artistHeroDetails}>
                <Text style={styles.artistHeroName} numberOfLines={2}>
                  {selectedArtist.name}
                </Text>
                <Text style={styles.artistHeroCount}>
                  {selectedArtist.trackCount}{' '}
                  {selectedArtist.trackCount === 1 ? 'canción' : 'canciones'}
                  {selectedArtist.albumCount > 0
                    ? ` • ${selectedArtist.albumCount} ${selectedArtist.albumCount === 1 ? 'álbum' : 'álbumes'}`
                    : ''}
                </Text>

                <TouchableOpacity
                  onPress={() => onPlayArtist && onPlayArtist(selectedArtist)}
                  disabled={selectedArtist.tracks.length === 0}
                  style={[
                    styles.playlistHeroPlayBtn,
                    selectedArtist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.playlistHeroPlayBtnText}>Reproducir Artista</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Árbol de Álbumes del Artista */}
            {selectedArtist.albums.length > 0 && (
              <View style={styles.artistTreeSectionHeader}>
                <View style={styles.artistTreeSectionTitleRow}>
                  <MaterialCommunityIcons name="album" size={16} color="#A78BFA" />
                  <Text style={styles.artistTreeSectionTitle}>
                    Álbumes y Colecciones ({selectedArtist.albums.length})
                  </Text>
                </View>
              </View>
            )}

            {/* Buscador dentro del Artista */}
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
          renderTrackItem && renderTrackItem(item, index, selectedArtist.tracks)
        }
      />
    );
  }

  // 1.B. Lista General de Artistas
  return (
    <FlatList
      data={displayArtists}
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
            <MaterialCommunityIcons name="account-search-outline" size={32} color="#A78BFA" />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? `Sin artistas para "${searchQuery}"` : 'No hay artistas en la biblioteca'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? 'Intenta con otro término de búsqueda.'
              : 'Escanea música o importa canciones para organizar por artistas.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.artistRow}>
          <TouchableOpacity
            onPress={() => onSelectArtist && onSelectArtist(item.id)}
            style={styles.artistRowMain}
            activeOpacity={0.7}
          >
            <View style={styles.artistAvatarContainer}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.artistAvatarImage} />
              ) : (
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.artistAvatarFallback}
                >
                  <MaterialCommunityIcons name="account-music" size={24} color="#FFFFFF" />
                </LinearGradient>
              )}
            </View>

            <View style={styles.artistRowDetails}>
              <Text style={styles.artistRowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.artistRowSub}>
                {item.trackCount} {item.trackCount === 1 ? 'canción' : 'canciones'}
                {item.albumCount > 0
                  ? ` • ${item.albumCount} ${item.albumCount === 1 ? 'álbum' : 'álbumes'}`
                  : ''}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.playlistRowActions}>
            <TouchableOpacity
              onPress={() => onPlayArtist && onPlayArtist(item)}
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
