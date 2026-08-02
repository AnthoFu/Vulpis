import React from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import styles from '../styles/QueueList.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useQueueList from '../hooks/useQueueList';
import TrackOptionsModal from './TrackOptionsModal';
import PlaylistPickerModal from './PlaylistPickerModal';

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
  isDriveConnected,
  onConnectDrive,
  onDisconnectDrive,
  onRefreshDrive,
  isDriveLoading,
  googleClientId,
  googleRedirectUri,
  onSelectTrack,
  playlists = [],
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
    isProcessing,
    searchQuery,
    setSearchQuery,
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
  });

  const renderPlaylistArtwork = (playlist) => {
    const firstTrackWithArtwork = playlist.tracks?.find(t => t.artworkUrl);
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
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.devWarningText}>
              <Text style={{ fontWeight: '700' }}>Desarrollador:</Text> Configura tu Client ID real en el archivo <Text style={{ fontFamily: 'monospace', color: '#A78BFA' }}>src/constants/config.js</Text> para habilitar la conexión.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.driveConnectBtn,
            (!isConfigured || isDriveLoading) && styles.driveConnectBtnDisabled
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

  // --- MODO DE RENDERIZADO DE BÚSQUEDA DE PLAYLISTS ---
  if (currentSource === 'playlists') {
    const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

    // 1. Detalles de una sola lista de reproducción seleccionada
    if (selectedPlaylist) {
      const filteredPlaylistTracks = selectedPlaylist.tracks.filter(track => {
        if (!searchQuery) return true;
        const title = (track.title || '').toLowerCase();
        const artist = (track.artist || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query) || artist.includes(query);
      });

      return (
        <FlatList
          data={filteredPlaylistTracks}
          keyExtractor={(item, index) => `${item.mediaId}-${index}`}
          contentContainerStyle={[styles.listContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {ListHeaderComponent}

              {/* Boton de volver */}
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
                      selectedPlaylist.tracks.length === 0 && styles.playlistHeroPlayBtnDisabled
                    ]}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.playlistHeroPlayBtnText}>Reproducir Lista</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search bar */}
              {selectedPlaylist.tracks.length > 0 && (
                <View style={[styles.searchSection, { marginBottom: 16 }]}>
                  <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#5F6070" style={styles.searchIcon} />
                    <TextInput
                      placeholder="Buscar en playlist..."
                      placeholderTextColor="#5F6070"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={styles.searchInput}
                    />
                  </View>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="music-note-plus" size={32} color="#A78BFA" />
              </View>
              <Text style={styles.emptyText}>Playlist vacía</Text>
              <Text style={styles.emptySubText}>Añade canciones desde tu Biblioteca Local o Google Drive pulsando en los tres puntos de cada pista.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
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
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rightActionsRow}>
                  {isCurrent && (
                    <MaterialCommunityIcons name="volume-high" size={20} color="#A78BFA" style={{ marginRight: 8 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => onRemoveTrackFromPlaylist && onRemoveTrackFromPlaylist(selectedPlaylistId, item.mediaId)}
                    style={styles.deleteTrackFromPlaylistBtn}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#8E8F9E" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      );
    }

    // 2. Vista de lista de reproducción (Playlists)
    const filteredPlaylists = playlists.filter(p => {
      if (!searchQuery) return true;
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    return (
      <FlatList
        data={filteredPlaylists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}

            {/* Header Title & Add Button */}
            <View style={[styles.playlistsHeaderRow, { paddingHorizontal: 0 }]}>
              <Text style={styles.playlistsTitle}>MIS LISTAS</Text>
              <TouchableOpacity
                onPress={() => setShowCreateInput(!showCreateInput)}
                style={styles.createPlaylistToggleBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={showCreateInput ? "close" : "plus"} size={22} color="#A78BFA" />
                <Text style={styles.createPlaylistToggleText}>{showCreateInput ? "Cancelar" : "Nueva"}</Text>
              </TouchableOpacity>
            </View>

            {/* Input box to create playlist */}
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
                  style={[styles.createPlaylistBtn, (!newPlaylistName || newPlaylistName.trim() === '') && styles.createPlaylistBtnDisabled]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createPlaylistBtnText}>Crear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search bar */}
            {playlists.length > 0 && (
              <View style={[styles.searchSection, { marginBottom: 16 }]}>
                <View style={styles.searchContainer}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#5F6070" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Buscar playlist..."
                    placeholderTextColor="#5F6070"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                  />
                </View>
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
            <Text style={styles.emptySubText}>Crea tu primera lista de reproducción arriba para empezar a organizar tu música.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.playlistRow}>
            <TouchableOpacity
              onPress={() => setSelectedPlaylistId(item.id)}
              style={styles.playlistRowMain}
              activeOpacity={0.7}
            >
              <View style={styles.playlistArtworkContainer}>
                {renderPlaylistArtwork(item)}
              </View>
              <View style={styles.playlistRowDetails}>
                <Text style={styles.playlistRowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistRowSub}>
                  {item.tracks.length} {item.tracks.length === 1 ? 'canción' : 'canciones'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.playlistRowActions}>
              <TouchableOpacity
                onPress={() => handlePlayPlaylist(item)}
                disabled={item.tracks.length === 0}
                style={[styles.playlistPlayRowBtn, item.tracks.length === 0 && styles.playlistPlayRowBtnDisabled]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="play" size={18} color={item.tracks.length === 0 ? "#5F6070" : "#FFFFFF"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Eliminar playlist',
                    `¿Seguro que deseas eliminar "${item.name}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => onDeletePlaylist && onDeletePlaylist(item.id) }
                    ]
                  );
                }}
                style={styles.playlistDeleteRowBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  }

  // --- RENDERIZADO DE BIBLIOTECA DE MÚSICA REGULAR / COLA ---
  const listData = isLoading ? [] : displayTracks;

  return (
    <>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.mediaId}-${index}`}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}

            {/* Google Drive Status Panel (only under private source library tab) */}
            {currentSource === 'private' && renderGoogleDrivePanel()}

            {/* Search Input (only visible in library view) */}
            {(currentSource === 'local' || (currentSource === 'private' && isDriveConnected)) && (
              <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#5F6070" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Buscar canción o artista..."
                    placeholderTextColor="#5F6070"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                  />
                </View>
              </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Buscando pistas de audio...</Text>
              </View>
            )}

            {/* Empty state handlers */}
            {!isLoading && displayTracks.length === 0 && (
              <View style={styles.emptyWrapper}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="music-off" size={32} color="#A78BFA" />
                </View>
                <Text style={styles.emptyText}>No se encontraron canciones</Text>
                {currentSource === 'local' && !searchQuery && (
                  <Text style={styles.emptySubText}>Usa "Escanear Audio" o "Importar MP3" para cargar música local.</Text>
                )}
                {currentSource === 'private' && isDriveConnected && !searchQuery && (
                  <Text style={styles.emptySubText}>No se encontraron archivos .mp3 en tu Google Drive.</Text>
                )}
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
                  <View style={styles.queueTitleRow}>
                    {isCurrent && (
                      <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
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
        }}
      />

      {/* MODAL DE OPCIONES DE CANCIÓN MODULARIZADO */}
      <TrackOptionsModal
        visible={selectedTrackForOptions !== null}
        track={selectedTrackForOptions}
        onClose={() => setSelectedTrackForOptions(null)}
        onAddToQueue={onAddToQueue}
        onAddPlaylistPress={() => setIsPlaylistPickerVisible(true)}
        onUploadLocalTrackToDrive={onUploadLocalTrackToDrive}
        onDownloadDriveTrack={onDownloadDriveTrack}
        onDeleteDriveTrack={onDeleteDriveTrack}
        onDeleteLocalTrack={onDeleteLocalTrack}
      />

      {/* MODAL DE SELECCIÓN DE PLAYLIST MODULARIZADO */}
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
