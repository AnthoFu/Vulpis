import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import { renderPlaylistArtwork } from './PlaylistArtwork';
import PlaylistDetailView from './PlaylistDetailView';

export { renderPlaylistArtwork };

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

  // 1. Si hay una playlist seleccionada, renderizar vista detallada modular
  if (selectedPlaylist) {
    return (
      <PlaylistDetailView
        playlist={selectedPlaylist}
        searchQuery={searchQuery}
        searchFilter={searchFilter}
        activeTrack={activeTrack}
        isProcessing={isProcessing}
        defaultArtwork={defaultArtwork}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        renderTabs={renderTabs}
        renderSearchBar={renderSearchBar}
        onBack={onBack}
        onPlayPlaylist={onPlayPlaylist}
        onRemoveTrackFromPlaylist={onRemoveTrackFromPlaylist}
        onSelectTrack={onSelectTrack}
        onClearSearch={onClearSearch}
      />
    );
  }

  // 2. Vista general de listado de Playlists
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
