import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import { filterTrackList } from '../../hooks/useQueueList';
import { formatDuration } from './TrackItem';
import { renderPlaylistArtwork } from './PlaylistArtwork';

/**
 * Vista detallada de canciones pertenecientes a una lista de reproducción seleccionada.
 */
export default function PlaylistDetailView({
  playlist,
  searchQuery = '',
  searchFilter = 'all',
  activeTrack = null,
  isProcessing = false,
  defaultArtwork,
  contentContainerStyle,
  ListHeaderComponent,
  renderTabs,
  renderSearchBar,
  onBack,
  onPlayPlaylist,
  onRemoveTrackFromPlaylist,
  onSelectTrack,
  onClearSearch,
}) {
  const filteredPlaylistTracks = playlist.tracks
    ? filterTrackList(playlist.tracks, searchQuery, searchFilter)
    : [];

  const isFavPlaylist = playlist.id === 'favorites' || playlist.isFavorites;

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
              {renderPlaylistArtwork(playlist)}
            </View>

            <View style={styles.playlistHeroDetails}>
              <Text style={styles.playlistHeroName} numberOfLines={2}>
                {playlist.name}
              </Text>
              <Text style={styles.playlistHeroCount}>
                {playlist.tracks.length}{' '}
                {playlist.tracks.length === 1 ? 'canción' : 'canciones'}
              </Text>

              <TouchableOpacity
                onPress={() => onPlayPlaylist && onPlayPlaylist(playlist)}
                disabled={playlist.tracks.length === 0}
                style={[
                  styles.playlistHeroPlayBtn,
                  playlist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
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
          {playlist.tracks.length > 0 && renderSearchBar && renderSearchBar()}
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <View
            style={[
              styles.emptyIconContainer,
              isFavPlaylist && {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                searchQuery
                  ? 'text-search'
                  : isFavPlaylist
                  ? 'heart-outline'
                  : 'music-note-plus'
              }
              size={32}
              color={isFavPlaylist && !searchQuery ? '#EF4444' : '#A78BFA'}
            />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `Sin resultados para "${searchQuery}"`
              : isFavPlaylist
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
          ) : isFavPlaylist ? (
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
        const durStr = formatDuration(item.duration);

        return (
          <View style={[styles.queueItem, isCurrent && styles.queueItemActive]}>
            <TouchableOpacity
              disabled={isProcessing}
              onPress={() => onSelectTrack && onSelectTrack(item, index, playlist.tracks)}
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
                  onRemoveTrackFromPlaylist && onRemoveTrackFromPlaylist(playlist.id, item.mediaId)
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
