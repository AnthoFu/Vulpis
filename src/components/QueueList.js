import React, { useMemo } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import styles from '../styles/QueueList.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useQueueList, { filterTrackList } from '../hooks/useQueueList';
import TrackOptionsModal from './TrackOptionsModal';
import PlaylistPickerModal from './PlaylistPickerModal';

function formatDuration(seconds) {
  if (!seconds || typeof seconds !== 'number' || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function QueueList({
  activeTrack,
  tracks,
  playQueue,
  ListHeaderComponent,
  contentContainerStyle,
  isLoading,
  currentSource,
  onSelectSource,
  onScanLocal,
  onImportMp3,
  onResetLocal,
  hasCustomLocalTracks,
  onAddToQueue,
  onRemoveFromQueue,
  isDriveConnected,
  onConnectDrive,
  onDisconnectDrive,
  onRefreshDrive,
  isDriveLoading,
  googleClientId,
  googleRedirectUri,
  onSelectTrack,
  playlists = [],
  isFavoriteTrack,
  onToggleFavorite,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  onUploadTrackToDrive,
  onUploadLocalTrackToDrive,
  onDeleteDriveTrack,
  onDownloadDriveTrack,
  onDeleteLocalTrack,
}) {
  const {
    activeTab,
    handleTabChange,
    tabs,
    artistTree,
    displayArtists,
    selectedArtistId,
    setSelectedArtistId,
    selectedArtist,
    handlePlayArtist,
    albumList,
    displayAlbums,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedAlbum,
    handlePlayAlbum,
    isProcessing,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    searchFilter,
    setSearchFilter,
    handleSelectFilter,
    searchFilters,
    searchPlaceholder,
    handleClearSearch,
    isDropdownOpen,
    setIsDropdownOpen,
    toggleDropdown,
    filterCounts,
    selectedPlaylistId,
    setSelectedPlaylistId,
    showCreateInput,
    setShowCreateInput,
    newPlaylistName,
    setNewPlaylistName,
    selectedTrackForOptions,
    setSelectedTrackForOptions,
    isPlaylistPickerVisible,
    setIsPlaylistPickerVisible,
    inlineNewPlaylistName,
    setInlineNewPlaylistName,
    selectTrack,
    handlePlayPlaylist,
    handleCreateNewPlaylist,
    handleCreateAndAdd,
    displayTracks,
    defaultArtwork,
  } = useQueueList({
    tracks,
    playlists,
    currentSource,
    onSelectTrack,
    onCreatePlaylist,
    onAddTrackToPlaylist,
    onSelectSource,
  });

  const renderPlaylistArtwork = (playlist) => {
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
  };

  const renderGoogleDrivePanel = () => {
    if (isDriveConnected) {
      return (
        <View style={styles.driveHeaderBanner}>
          <View style={styles.driveStatusCol}>
            <View style={styles.driveStatusIndicator}>
              <MaterialCommunityIcons name="google-drive" size={20} color="#A78BFA" />
              <Text style={styles.driveStatusText}>Conectado a Google Drive</Text>
            </View>
            <Text style={styles.driveInfoText}>Listo para transmitir canciones</Text>
          </View>
          <View style={styles.driveActionsCol}>
            {onUploadTrackToDrive && (
              <TouchableOpacity
                onPress={onUploadTrackToDrive}
                disabled={isDriveLoading || isLoading}
                style={[styles.driveActionBtn, styles.driveUploadBtn]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cloud-upload" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onRefreshDrive}
              disabled={isDriveLoading || isLoading}
              style={[styles.driveActionBtn, styles.driveRefreshBtn]}
              activeOpacity={0.7}
            >
              {isDriveLoading || isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDisconnectDrive}
              disabled={isDriveLoading || isLoading}
              style={[styles.driveActionBtn, styles.driveDisconnectBtn]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const isConfigured = googleClientId && !googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID');

    return (
      <View style={styles.driveConnectCard}>
        <View style={styles.driveCardHeader}>
          <View style={styles.driveIconWrapper}>
            <MaterialCommunityIcons name="google-drive" size={32} color="#8B5CF6" />
          </View>
          <View style={styles.driveCardTitleCol}>
            <Text style={styles.driveCardTitle}>Nube Privada</Text>
            <Text style={styles.driveCardSubtitle}>Transmite tu música desde Google Drive</Text>
          </View>
        </View>

        <Text style={styles.driveDescriptionText}>
          Conecta tu cuenta para sincronizar y transmitir directamente tus archivos de audio (.mp3) guardados en Google Drive. Tus datos y archivos se manejan con total privacidad.
        </Text>

        {!isConfigured && (
          <View style={styles.devWarningBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color="#F59E0B"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.devWarningText}>
              <Text style={{ fontWeight: '700' }}>Desarrollador:</Text> Configura tu Client ID real en el archivo{' '}
              <Text style={{ fontFamily: 'monospace', color: '#A78BFA' }}>src/constants/config.js</Text> para habilitar la conexión.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.driveConnectBtn,
            (!isConfigured || isDriveLoading) && styles.driveConnectBtnDisabled,
          ]}
          disabled={!isConfigured || isDriveLoading}
          onPress={() => onConnectDrive(googleClientId, googleRedirectUri)}
          activeOpacity={0.8}
        >
          {isDriveLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="google-drive" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.driveConnectBtnText}>Conectar Google Drive</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Selector de pestañas superior: Canciones, Artistas, Álbumes, Playlists
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        bounces={false}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showCount = tab.id === 'songs' && tracks && tracks.length > 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={15}
                color={isActive ? '#A78BFA' : '#8E8F9E'}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {showCount && (
                <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {tracks.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );


  // Barra de búsqueda con sugerencias desplegables contextuales estilo Odoo
  const renderSearchBar = () => {
    const isTyping = searchQuery.trim().length > 0;
    const activeFilterObj = searchFilters.find((f) => f.id === searchFilter);

    return (
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8B5CF6" style={styles.searchIcon} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor="#5F6070"
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="never"
          />

          {/* Botón de limpiar texto */}
          {isTyping && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.searchClearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#8E8F9E" />
            </TouchableOpacity>
          )}

          {/* Botón chevron estilo Odoo para abrir/cerrar sugerencias */}
          {isTyping && (activeTab === 'songs' || selectedPlaylistId) && (
            <TouchableOpacity
              onPress={toggleDropdown}
              style={styles.searchChevronBtn}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isDropdownOpen ? 'menu-up' : 'menu-down'}
                size={22}
                color="#A78BFA"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* MENÚ DESPLEGABLE CONTEXTUAL ESTILO ODOO (Solo visible al escribir) */}
        {isTyping && isDropdownOpen && (activeTab === 'songs' || selectedPlaylistId) && (
          <View style={styles.odooDropdownContainer}>
            <View style={styles.odooDropdownHeader}>
              <Text style={styles.odooDropdownHeaderText}>Filtrar búsqueda por campo</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={16} color="#8E8F9E" />
              </TouchableOpacity>
            </View>

            {searchFilters.map((filter) => {
              const isActive = searchFilter === filter.id;
              const count = filterCounts[filter.id] ?? 0;

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.odooDropdownItem,
                    isActive && styles.odooDropdownItemActive,
                  ]}
                  onPress={() => handleSelectFilter(filter.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.odooDropdownItemLeft}>
                    <MaterialCommunityIcons
                      name={filter.icon}
                      size={18}
                      color={isActive ? '#A78BFA' : '#8E8F9E'}
                    />
                    <Text style={styles.odooDropdownItemText} numberOfLines={1}>
                      Buscar <Text style={styles.odooDropdownFieldText}>{filter.label}</Text> para:{' '}
                      <Text style={styles.odooDropdownQueryText}>"{searchQuery.trim()}"</Text>
                    </Text>
                  </View>

                  <View style={styles.odooDropdownItemRight}>
                    <View
                      style={[
                        styles.odooCountBadge,
                        isActive && styles.odooCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.odooCountText,
                          isActive && styles.odooCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                    {isActive && (
                      <MaterialCommunityIcons name="check" size={16} color="#A78BFA" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fila compacta de filtro activo cuando el dropdown está colapsado */}
        {isTyping && !isDropdownOpen && (activeTab === 'songs' || selectedPlaylistId) && (
          <View style={styles.activeFilterRow}>
            <TouchableOpacity
              style={styles.activeFilterPill}
              onPress={toggleDropdown}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={activeFilterObj?.icon || 'filter-variant'}
                size={14}
                color="#A78BFA"
              />
              <Text style={styles.activeFilterPillText}>
                {activeFilterObj?.label || 'Filtro'}: "{searchQuery.trim()}" (
                {filterCounts[searchFilter] ?? displayTracks.length})
              </Text>
              <MaterialCommunityIcons name="menu-down" size={16} color="#A78BFA" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <Text style={styles.searchResultsClearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Información general para pestañas de artistas/álbumes */}
        {isTyping && (activeTab === 'artists' || activeTab === 'albums' || (activeTab === 'playlists' && !selectedPlaylistId)) && (
          <View style={styles.searchResultsInfoRow}>
            <Text style={styles.searchResultsInfoText}>
              {activeTab === 'artists' &&
                `${displayArtists.length} ${displayArtists.length === 1 ? 'artista encontrado' : 'artistas encontrados'}`}
              {activeTab === 'albums' &&
                `${displayAlbums.length} ${displayAlbums.length === 1 ? 'álbum encontrado' : 'álbumes encontrados'}`}
              {activeTab === 'playlists' &&
                `Filtrando playlists por "${searchQuery.trim()}"`}
            </Text>
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <Text style={styles.searchResultsClearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Renderizador estándar de fila de canción
  const renderTrackItem = (item, index, contextTracks, showTrackNumber = false) => {
    const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
    const durStr = formatDuration(item.duration);

    return (
      <View
        key={`${item.mediaId}-${index}`}
        style={[
          styles.queueItem,
          isCurrent && styles.queueItemActive,
          isProcessing && styles.queueItemDisabled,
        ]}
      >
        <TouchableOpacity
          disabled={isProcessing}
          onPress={() => selectTrack(item, index, contextTracks)}
          style={styles.itemMainContent}
          activeOpacity={0.7}
        >
          {showTrackNumber ? (
            <View style={styles.trackNumberBadge}>
              <Text style={styles.trackNumberText}>{index + 1}</Text>
            </View>
          ) : (
            <Image source={{ uri: item.artworkUrl || defaultArtwork }} style={styles.queueArtwork} />
          )}

          <View style={styles.queueDetails}>
            <View style={styles.queueTitleRow}>
              {isCurrent && (
                <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
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
            <MaterialCommunityIcons name="volume-high" size={20} color="#A78BFA" style={{ marginRight: 8 }} />
          )}
          <TouchableOpacity
            onPress={() => setSelectedTrackForOptions(item)}
            style={styles.addToQueueButton}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#8E8F9E" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // 1. PESTAÑA: ÁRBOL DE ARTISTAS
  // ==========================================
  if (activeTab === 'artists') {
    // 1.A. Vista detallada del Árbol del Artista seleccionado
    if (selectedArtist) {
      const filteredArtistTracks = searchQuery
        ? filterTrackList(selectedArtist.tracks, searchQuery, 'all')
        : selectedArtist.tracks;

      return (
        <>
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
                {renderTabs()}

                {/* Botón Volver a Artistas */}
                <TouchableOpacity
                  onPress={() => setSelectedArtistId(null)}
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
                      <Image source={{ uri: selectedArtist.artworkUrl }} style={styles.artistHeroAvatarImage} />
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
                      {selectedArtist.trackCount} {selectedArtist.trackCount === 1 ? 'canción' : 'canciones'}
                      {selectedArtist.albumCount > 0
                        ? ` • ${selectedArtist.albumCount} ${selectedArtist.albumCount === 1 ? 'álbum' : 'álbumes'}`
                        : ''}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handlePlayArtist(selectedArtist)}
                      disabled={selectedArtist.tracks.length === 0}
                      style={[
                        styles.playlistHeroPlayBtn,
                        selectedArtist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
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
                {renderSearchBar()}
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
              renderTrackItem(item, index, selectedArtist.tracks)
            }
          />

          <TrackOptionsModal
            visible={selectedTrackForOptions !== null}
            track={selectedTrackForOptions}
            isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
            onToggleFavorite={onToggleFavorite}
            onClose={() => setSelectedTrackForOptions(null)}
            onAddToQueue={onAddToQueue}
            onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
            onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
            onDownloadDriveTrack={onDownloadDriveTrack}
            onDeleteDriveTrack={onDeleteDriveTrack}
            onDeleteLocalTrack={onDeleteLocalTrack}
          />

          <PlaylistPickerModal
            visible={isPlaylistPickerVisible}
            playlists={playlists}
            track={selectedTrackForOptions}
            onClose={() => {
              setIsPlaylistPickerVisible(false);
              setSelectedTrackForOptions(null);
            }}
            onAddTrackToPlaylist={onAddTrackToPlaylist}
            inlineNewPlaylistName={inlineNewPlaylistName}
            setInlineNewPlaylistName={setInlineNewPlaylistName}
            handleCreateAndAdd={handleCreateAndAdd}
          />
        </>
      );
    }

    // 1.B. Lista General de Artistas
    return (
      <>
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
              {currentSource === 'private' && renderGoogleDrivePanel()}
              {renderSearchBar()}
              {renderTabs()}
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
                onPress={() => setSelectedArtistId(item.id)}
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
                    {item.albumCount > 0 ? ` • ${item.albumCount} ${item.albumCount === 1 ? 'álbum' : 'álbumes'}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.playlistRowActions}>
                <TouchableOpacity
                  onPress={() => handlePlayArtist(item)}
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

        <TrackOptionsModal
          visible={selectedTrackForOptions !== null}
          track={selectedTrackForOptions}
          isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setSelectedTrackForOptions(null)}
          onAddToQueue={onAddToQueue}
          onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
          onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
          onDownloadDriveTrack={onDownloadDriveTrack}
          onDeleteDriveTrack={onDeleteDriveTrack}
          onDeleteLocalTrack={onDeleteLocalTrack}
        />

        <PlaylistPickerModal
          visible={isPlaylistPickerVisible}
          playlists={playlists}
          track={selectedTrackForOptions}
          onClose={() => {
            setIsPlaylistPickerVisible(false);
            setSelectedTrackForOptions(null);
          }}
          onAddTrackToPlaylist={onAddTrackToPlaylist}
          inlineNewPlaylistName={inlineNewPlaylistName}
          setInlineNewPlaylistName={setInlineNewPlaylistName}
          handleCreateAndAdd={handleCreateAndAdd}
        />
      </>
    );
  }

  // ==========================================
  // 2. PESTAÑA: ÁLBUMES
  // ==========================================
  if (activeTab === 'albums') {
    // 2.A. Vista detallada del Álbum seleccionado
    if (selectedAlbum) {
      const filteredAlbumTracks = searchQuery
        ? filterTrackList(selectedAlbum.tracks, searchQuery, 'all')
        : selectedAlbum.tracks;

      return (
        <>
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
                {renderTabs()}

                {/* Botón Volver a Álbumes */}
                <TouchableOpacity
                  onPress={() => setSelectedAlbumId(null)}
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
                      <Image source={{ uri: selectedAlbum.artworkUrl }} style={styles.albumHeroArtworkImage} />
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
                      {selectedAlbum.trackCount} {selectedAlbum.trackCount === 1 ? 'canción' : 'canciones'}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handlePlayAlbum(selectedAlbum)}
                      disabled={selectedAlbum.tracks.length === 0}
                      style={[
                        styles.playlistHeroPlayBtn,
                        selectedAlbum.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.playlistHeroPlayBtnText}>Reproducir Álbum</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Buscador dentro del Álbum */}
                {renderSearchBar()}
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
              renderTrackItem(item, index, selectedAlbum.tracks, true)
            }
          />

          <TrackOptionsModal
            visible={selectedTrackForOptions !== null}
            track={selectedTrackForOptions}
            isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
            onToggleFavorite={onToggleFavorite}
            onClose={() => setSelectedTrackForOptions(null)}
            onAddToQueue={onAddToQueue}
            onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
            onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
            onDownloadDriveTrack={onDownloadDriveTrack}
            onDeleteDriveTrack={onDeleteDriveTrack}
            onDeleteLocalTrack={onDeleteLocalTrack}
          />

          <PlaylistPickerModal
            visible={isPlaylistPickerVisible}
            playlists={playlists}
            track={selectedTrackForOptions}
            onClose={() => {
              setIsPlaylistPickerVisible(false);
              setSelectedTrackForOptions(null);
            }}
            onAddTrackToPlaylist={onAddTrackToPlaylist}
            inlineNewPlaylistName={inlineNewPlaylistName}
            setInlineNewPlaylistName={setInlineNewPlaylistName}
            handleCreateAndAdd={handleCreateAndAdd}
          />
        </>
      );
    }

    // 2.B. Lista General de Álbumes
    return (
      <>
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
              {currentSource === 'private' && renderGoogleDrivePanel()}
              {renderSearchBar()}
              {renderTabs()}
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
                onPress={() => setSelectedAlbumId(item.id)}
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
                  onPress={() => handlePlayAlbum(item)}
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

        <TrackOptionsModal
          visible={selectedTrackForOptions !== null}
          track={selectedTrackForOptions}
          isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setSelectedTrackForOptions(null)}
          onAddToQueue={onAddToQueue}
          onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
          onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
          onDownloadDriveTrack={onDownloadDriveTrack}
          onDeleteDriveTrack={onDeleteDriveTrack}
          onDeleteLocalTrack={onDeleteLocalTrack}
        />

        <PlaylistPickerModal
          visible={isPlaylistPickerVisible}
          playlists={playlists}
          track={selectedTrackForOptions}
          onClose={() => {
            setIsPlaylistPickerVisible(false);
            setSelectedTrackForOptions(null);
          }}
          onAddTrackToPlaylist={onAddTrackToPlaylist}
          inlineNewPlaylistName={inlineNewPlaylistName}
          setInlineNewPlaylistName={setInlineNewPlaylistName}
          handleCreateAndAdd={handleCreateAndAdd}
        />
      </>
    );
  }

  // ==========================================
  // 3. PESTAÑA: PLAYLISTS
  // ==========================================
  if (activeTab === 'playlists') {
    const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

    // 3.A. Detalles de una playlist seleccionada
    if (selectedPlaylist) {
      const filteredPlaylistTracks = selectedPlaylist.tracks
        ? filterTrackList(selectedPlaylist.tracks, searchQuery, searchFilter)
        : [];

      return (
        <>
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
                {renderTabs()}

                {/* Botón Volver */}
                <TouchableOpacity
                  onPress={() => setSelectedPlaylistId(null)}
                  style={styles.playlistBackBtnContainer}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#8E8F9E" />
                  <Text style={styles.playlistBackBtnText}>Volver a mis listas</Text>
                </TouchableOpacity>

                {/* Hero Banner */}
                <View style={styles.playlistHeroCard}>
                  <View style={styles.playlistHeroArtworkContainer}>
                    {renderPlaylistArtwork(selectedPlaylist)}
                  </View>

                  <View style={styles.playlistHeroDetails}>
                    <Text style={styles.playlistHeroName} numberOfLines={2}>
                      {selectedPlaylist.name}
                    </Text>
                    <Text style={styles.playlistHeroCount}>
                      {selectedPlaylist.tracks.length} {selectedPlaylist.tracks.length === 1 ? 'canción' : 'canciones'}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handlePlayPlaylist(selectedPlaylist)}
                      disabled={selectedPlaylist.tracks.length === 0}
                      style={[
                        styles.playlistHeroPlayBtn,
                        selectedPlaylist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled,
                      ]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.playlistHeroPlayBtnText}>Reproducir Lista</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Barra de búsqueda en la playlist */}
                {selectedPlaylist.tracks.length > 0 && renderSearchBar()}
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
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchBtn} activeOpacity={0.7}>
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
                    onPress={() => selectTrack(item, index, selectedPlaylist.tracks)}
                    style={styles.itemMainContent}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.artworkUrl || defaultArtwork }} style={styles.queueArtwork} />
                    <View style={styles.queueDetails}>
                      <View style={styles.queueTitleRow}>
                        {isCurrent && (
                          <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
                        )}
                        <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
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
                      <MaterialCommunityIcons name="volume-high" size={20} color="#A78BFA" style={{ marginRight: 8 }} />
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

          <TrackOptionsModal
            visible={selectedTrackForOptions !== null}
            track={selectedTrackForOptions}
            isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
            onToggleFavorite={onToggleFavorite}
            onClose={() => setSelectedTrackForOptions(null)}
            onAddToQueue={onAddToQueue}
            onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
            onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
            onDownloadDriveTrack={onDownloadDriveTrack}
            onDeleteDriveTrack={onDeleteDriveTrack}
            onDeleteLocalTrack={onDeleteLocalTrack}
          />

          <PlaylistPickerModal
            visible={isPlaylistPickerVisible}
            playlists={playlists}
            track={selectedTrackForOptions}
            onClose={() => {
              setIsPlaylistPickerVisible(false);
              setSelectedTrackForOptions(null);
            }}
            onAddTrackToPlaylist={onAddTrackToPlaylist}
            inlineNewPlaylistName={inlineNewPlaylistName}
            setInlineNewPlaylistName={setInlineNewPlaylistName}
            handleCreateAndAdd={handleCreateAndAdd}
          />
        </>
      );
    }

    // 3.B. Vista general de Playlists
    const filteredPlaylists = playlists.filter((p) => {
      if (!searchQuery) return true;
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <>
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
              {currentSource === 'private' && renderGoogleDrivePanel()}

              {/* Buscador de playlists */}
              {playlists.length > 0 && renderSearchBar()}

              {/* Chips de navegación */}
              {renderTabs()}

              {/* Título de Playlists y botón Nueva */}
              <View style={[styles.playlistsHeaderRow, { paddingHorizontal: 0 }]}>
                <Text style={styles.playlistsTitle}>MIS LISTAS</Text>
                <TouchableOpacity
                  onPress={() => setShowCreateInput(!showCreateInput)}
                  style={styles.createPlaylistToggleBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={showCreateInput ? 'close' : 'plus'} size={22} color="#A78BFA" />
                  <Text style={styles.createPlaylistToggleText}>{showCreateInput ? 'Cancelar' : 'Nueva'}</Text>
                </TouchableOpacity>
              </View>

              {/* Campo para crear nueva playlist */}
              {showCreateInput && (
                <View style={styles.createPlaylistInputRow}>
                  <TextInput
                    placeholder="Nombre de la playlist..."
                    placeholderTextColor="#5F6070"
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    style={styles.createPlaylistInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleCreateNewPlaylist}
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
                  onPress={() => setSelectedPlaylistId(item.id)}
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
                    onPress={() => handlePlayPlaylist(item)}
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
                        Alert.alert('Eliminar playlist', `¿Seguro que deseas eliminar "${item.name}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: () => onDeletePlaylist && onDeletePlaylist(item.id),
                          },
                        ]);
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

        <TrackOptionsModal
          visible={selectedTrackForOptions !== null}
          track={selectedTrackForOptions}
          isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setSelectedTrackForOptions(null)}
          onAddToQueue={onAddToQueue}
          onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
          onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
          onDownloadDriveTrack={onDownloadDriveTrack}
          onDeleteDriveTrack={onDeleteDriveTrack}
          onDeleteLocalTrack={onDeleteLocalTrack}
        />

        <PlaylistPickerModal
          visible={isPlaylistPickerVisible}
          playlists={playlists}
          track={selectedTrackForOptions}
          onClose={() => {
            setIsPlaylistPickerVisible(false);
            setSelectedTrackForOptions(null);
          }}
          onAddTrackToPlaylist={onAddTrackToPlaylist}
          inlineNewPlaylistName={inlineNewPlaylistName}
          setInlineNewPlaylistName={setInlineNewPlaylistName}
          handleCreateAndAdd={handleCreateAndAdd}
        />
      </>
    );
  }

  // ==========================================
  // 4. PESTAÑA: CANCIONES (VISTA REGULAR DE BIBLIOTECA)
  // ==========================================
  const listData = isLoading ? [] : displayTracks;

  return (
    <>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.mediaId}-${index}`}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}

            {/* Panel de Google Drive */}
            {currentSource === 'private' && renderGoogleDrivePanel()}

            {/* Buscador y chips de filtro */}
            {(currentSource === 'local' || (currentSource === 'private' && isDriveConnected)) &&
              renderSearchBar()}

            {/* Chips de navegación por categoría */}
            {renderTabs()}

            {/* Indicador de carga */}
            {isLoading && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Buscando pistas de audio...</Text>
              </View>
            )}

            {/* Estado vacío */}
            {!isLoading && displayTracks.length === 0 && (
              <View style={styles.emptyWrapper}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons
                    name={searchQuery ? 'text-search' : 'music-off'}
                    size={32}
                    color="#A78BFA"
                  />
                </View>
                <Text style={styles.emptyText}>
                  {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No se encontraron canciones'}
                </Text>
                {searchQuery ? (
                  <>
                    <Text style={styles.emptySubText}>
                      No se encontraron canciones que coincidan con el filtro "
                      {searchFilters.find((f) => f.id === searchFilter)?.label}".
                    </Text>
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchBtn} activeOpacity={0.7}>
                      <Text style={styles.clearSearchBtnText}>Mostrar todas las canciones</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {currentSource === 'local' && (
                      <Text style={styles.emptySubText}>Usa "Escanear Audio" o "Importar MP3" para cargar música local.</Text>
                    )}
                    {currentSource === 'private' && isDriveConnected && (
                      <Text style={styles.emptySubText}>No se encontraron archivos .mp3 en tu Google Drive.</Text>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        }
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => renderTrackItem(item, index, tracks)}
      />

      {/* Modal de opciones de canción */}
      <TrackOptionsModal
        visible={selectedTrackForOptions !== null}
        track={selectedTrackForOptions}
        isFavorite={selectedTrackForOptions ? isFavoriteTrack?.(selectedTrackForOptions.mediaId) : false}
        onToggleFavorite={onToggleFavorite}
        onClose={() => setSelectedTrackForOptions(null)}
        onAddToQueue={onAddToQueue}
        onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
        onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
        onDownloadDriveTrack={onDownloadDriveTrack}
        onDeleteDriveTrack={onDeleteDriveTrack}
        onDeleteLocalTrack={onDeleteLocalTrack}
      />

      {/* Modal de selección de playlist */}
      <PlaylistPickerModal
        visible={isPlaylistPickerVisible}
        playlists={playlists}
        track={selectedTrackForOptions}
        onClose={() => {
          setIsPlaylistPickerVisible(false);
          setSelectedTrackForOptions(null);
        }}
        onAddTrackToPlaylist={onAddTrackToPlaylist}
        inlineNewPlaylistName={inlineNewPlaylistName}
        setInlineNewPlaylistName={setInlineNewPlaylistName}
        handleCreateAndAdd={handleCreateAndAdd}
      />
    </>
  );
}
