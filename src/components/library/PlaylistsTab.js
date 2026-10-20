import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/QueueList.styles';
import { filterTrackList } from '../../hooks/useQueueList';
import { formatDuration } from './TrackItem';

/**
 * Renderiza la carátula o gradiente identificador de una lista de reproducción.
 */
export function renderPlaylistArtwork(playlist) {
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

/**
 * Pestaña de Playlists (Listado de listas de reproducción y vista detallada de canciones).
 */
export default function PlaylistsTab({
  playlists = [],
  selectedPlaylistId = null,
  searchQuery = '',
  searchFilter = 'all',
  showCreateInput = false,
  newPlaylistName = '',
  activeTrack = null,
  isProcessing = false,
  defaultArtwork,
  contentContainerStyle,
  ListHeaderComponent,
  renderTabs,
  renderSearchBar,
  renderGoogleDrivePanel,
  onSelectPlaylist,
  onPlayPlaylist,
  onBack,
  onToggleCreateInput,
  onChangeNewPlaylistName,
  onCreateNewPlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onSelectTrack,
  onClearSearch,
  currentSource,
}) {
  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // 3.A. Detalles de una playlist seleccionada
  if (selectedPlaylist) {
    const filteredPlaylistTracks = selectedPlaylist.tracks
      ? filterTrackList(selectedPlaylist.tracks, searchQuery, searchFilter)
      : [];

    return (
      <FlatList
        data={filteredPlaylistTracks}
        keyExtractor={(item, index) => `${item.mediaId}-${index}`}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {renderTabs && renderTabs()}

            {/* Botón Volver */}
            <TouchableOpacity
              onPress={onBack}
              style={styles.playlistBackBtnContainer}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8F9E" />
              <Text style={styles.playlistBackBtnText}>Volver a mis listas</Text>
            </TouchableOpacity>

            {/* Hero Banner de Playlist */}
            <View style={styles.playlistHeroCard}>
              <View style={styles.playlistHeroArtworkContainer}>
                {renderPlaylistArtwork(selectedPlaylist)}
              </View>

              <View style={styles.playlistHeroDetails}>
                <Text style={styles.playlistHeroName} numberOfLines={2}>
                  {selectedPlaylist.name}
                </Text>
                <Text style={styles.playlistHeroCount}>
                  {selectedPlaylist.tracks.length}{' '}
                  {selectedPlaylist.tracks.length === 1 ? 'canción' : 'canciones'}
                </Text>

                <TouchableOpacity
                  onPress={() => onPlayPlaylist && onPlayPlaylist(selectedPlaylist)}
                  disabled={selectedPlaylist.tracks.length === 0}
                  style={[
                    styles.playlistHeroPlayBtn,
                    selectedPlaylist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.playlistHeroPlayBtnText}>Reproducir Lista</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Barra de búsqueda en la playlist */}
            {selectedPlaylist.tracks.length > 0 && renderSearchBar && renderSearchBar()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View
              style={[
                styles.emptyIconContainer,
                (selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites) && {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  searchQuery
                    ? 'text-search'
                    : selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites
                    ? 'heart-outline'
                    : 'music-note-plus'
                }
                size={32}
                color={
                  (selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites) && !searchQuery
                    ? '#EF4444'
                    : '#A78BFA'
                }
              />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites
                ? 'Sin canciones favoritas'
                : 'Playlist vacía'}
            </Text>
            {searchQuery ? (
              <>
                <Text style={styles.emptySubText}>
                  No hay pistas que coincidan con el filtro en esta lista de reproducción.
                </Text>
                <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchBtn} activeOpacity={0.7}>
                  <Text style={styles.clearSearchBtnText}>Mostrar todas las canciones</Text>
                </TouchableOpacity>
              </>
            ) : selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites ? (
              <Text style={styles.emptySubText}>
                Toca el corazón en el reproductor o en las opciones de cualquier canción para guardarla aquí automáticamente.
              </Text>
            ) : (
              <Text style={styles.emptySubText}>
                Añade canciones desde tu Biblioteca Local o Google Drive pulsando en los tres puntos de cada pista.
              </Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
          const isFavPlaylist = selectedPlaylist.id === 'favorites' || selectedPlaylist.isFavorites;
          const durStr = formatDuration(item.duration);

          return (
            <View style={[styles.queueItem, isCurrent && styles.queueItemActive]}>
              <TouchableOpacity
                disabled={isProcessing}
                onPress={() => onSelectTrack && onSelectTrack(item, index, selectedPlaylist.tracks)}
                style={styles.itemMainContent}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.artworkUrl || defaultArtwork }}
                  style={styles.queueArtwork}
                />
                <View style={styles.queueDetails}>
                  <View style={styles.queueTitleRow}>
                    {isCurrent && (
                      <MaterialCommunityIcons
                        name="volume-high"
                        size={16}
                        color="#A78BFA"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      style={[styles.queueTitle, isCurrent && styles.queueTextActive]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <View style={styles.queueSubtitleRow}>
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {item.artist}
                      {item.album && item.album !== 'Álbum Desconocido' && item.album !== 'Desconocido'
                        ? ` • ${item.album}`
                        : ''}
                      {durStr ? ` • ${durStr}` : ''}
                    </Text>
                    {item.genre ? (
                      <View style={styles.genreBadge}>
                        <Text style={styles.genreBadgeText} numberOfLines={1}>
                          {item.genre}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.rightActionsRow}>
                {isCurrent && (
                  <MaterialCommunityIcons
                    name="volume-high"
                    size={20}
                    color="#A78BFA"
                    style={{ marginRight: 8 }}
                  />
                )}
                <TouchableOpacity
                  onPress={() =>
                    onRemoveTrackFromPlaylist && onRemoveTrackFromPlaylist(selectedPlaylistId, item.mediaId)
                  }
                  style={styles.deleteTrackFromPlaylistBtn}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons
                    name={isFavPlaylist ? 'heart' : 'trash-can-outline'}
                    size={20}
                    color={isFavPlaylist ? '#EF4444' : '#8E8F9E'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    );
  }

  // 3.B. Vista general de Playlists
  const filteredPlaylists = playlists.filter((p) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <FlatList
      data={filteredPlaylists}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          {currentSource === 'private' && renderGoogleDrivePanel && renderGoogleDrivePanel()}

          {/* Buscador de playlists */}
          {playlists.length > 0 && renderSearchBar && renderSearchBar()}

          {/* Selector de pestañas */}
          {renderTabs && renderTabs()}

          {/* Título de Playlists y botón Nueva */}
          <View style={[styles.playlistsHeaderRow, { paddingHorizontal: 0 }]}>
            <Text style={styles.playlistsTitle}>MIS LISTAS</Text>
            <TouchableOpacity
              onPress={onToggleCreateInput}
              style={styles.createPlaylistToggleBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={showCreateInput ? 'close' : 'plus'}
                size={22}
                color="#A78BFA"
              />
              <Text style={styles.createPlaylistToggleText}>
                {showCreateInput ? 'Cancelar' : 'Nueva'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campo para crear nueva playlist */}
          {showCreateInput && (
            <View style={styles.createPlaylistInputRow}>
              <TextInput
                placeholder="Nombre de la playlist..."
                placeholderTextColor="#5F6070"
                value={newPlaylistName}
                onChangeText={onChangeNewPlaylistName}
                style={styles.createPlaylistInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={onCreateNewPlaylist}
                disabled={!newPlaylistName || newPlaylistName.trim() === ''}
                style={[
                  styles.createPlaylistBtn,
                  (!newPlaylistName || newPlaylistName.trim() === '') && styles.createPlaylistBtnDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.createPlaylistBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="playlist-music-outline" size={32} color="#A78BFA" />
          </View>
          <Text style={styles.emptyText}>No hay playlists</Text>
          <Text style={styles.emptySubText}>
            Crea tu primera lista de reproducción arriba para empezar a organizar tu música.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isFav = item.id === 'favorites' || item.isFavorites;
        return (
          <View style={[styles.playlistRow, isFav && styles.favoritePlaylistRow]}>
            <TouchableOpacity
              onPress={() => onSelectPlaylist && onSelectPlaylist(item.id)}
              style={styles.playlistRowMain}
              activeOpacity={0.7}
            >
              <View style={styles.playlistArtworkContainer}>{renderPlaylistArtwork(item)}</View>
              <View style={styles.playlistRowDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playlistRowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isFav && (
                    <View style={styles.favoriteBadge}>
                      <Text style={styles.favoriteBadgeText}>AUTOMÁTICA</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.playlistRowSub}>
                  {item.tracks.length} {item.tracks.length === 1 ? 'canción' : 'canciones'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.playlistRowActions}>
              <TouchableOpacity
                onPress={() => onPlayPlaylist && onPlayPlaylist(item)}
                disabled={item.tracks.length === 0}
                style={[
                  styles.playlistPlayRowBtn,
                  item.tracks.length === 0 && styles.playlistPlayRowBtnDisabled,
                ]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={18}
                  color={item.tracks.length === 0 ? '#5F6070' : '#FFFFFF'}
                />
              </TouchableOpacity>
              {!isFav && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Eliminar playlist',
                      `¿Seguro que deseas eliminar "${item.name}"?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () => onDeletePlaylist && onDeletePlaylist(item.id),
                        },
                      ]
                    );
                  }}
                  style={styles.playlistDeleteRowBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}
