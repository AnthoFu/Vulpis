import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
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
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'queue'

  // Playlists States
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [isPlaylistPickerVisible, setIsPlaylistPickerVisible] = useState(false);
  const [inlineNewPlaylistName, setInlineNewPlaylistName] = useState('');

  // Reset selected playlist if source changes
  useEffect(() => {
    setSelectedPlaylistId(null);
    setSearchQuery('');
  }, [currentSource]);

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

  const selectTrack = async (item, index, playlistTracks) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (onSelectTrack) {
        await onSelectTrack(item, index, playlistTracks);
      } else {
        const trackList = playlistTracks || tracks;
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(trackList);
        await TrackPlayer.skipToIndex(index);
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('Error selecting track:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayPlaylist = async (playlist) => {
    if (!playlist || playlist.tracks.length === 0) {
      Alert.alert('Playlist vacía', 'Añade canciones a esta playlist antes de reproducirla.');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await TrackPlayer.clear();
      await TrackPlayer.setMediaItems(playlist.tracks);
      await TrackPlayer.skipToIndex(0);
      await TrackPlayer.play();
    } catch (e) {
      console.error('Error playing playlist:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName || newPlaylistName.trim() === '') return;
    if (onCreatePlaylist) {
      await onCreatePlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreateInput(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!inlineNewPlaylistName || inlineNewPlaylistName.trim() === '') return;
    if (onCreatePlaylist && onAddTrackToPlaylist && selectedTrackForOptions) {
      const created = await onCreatePlaylist(inlineNewPlaylistName);
      if (created) {
        await onAddTrackToPlaylist(created.id, selectedTrackForOptions);
      }
      setInlineNewPlaylistName('');
      setIsPlaylistPickerVisible(false);
      setSelectedTrackForOptions(null);
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

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  // --- RENDER PLAYLISTS BROWSING MODE ---
  if (currentSource === 'playlists') {
    const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
    const horizontalPadding = {
      paddingLeft: contentContainerStyle?.paddingLeft ?? 20,
      paddingRight: contentContainerStyle?.paddingRight ?? 20,
    };

    // 1. Details of a single selected playlist
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

              {/* Back button & Title */}
              <View style={[styles.playlistDetailHeader, { paddingHorizontal: 0 }]}>
                <TouchableOpacity
                  onPress={() => setSelectedPlaylistId(null)}
                  style={styles.playlistBackBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.playlistDetailName} numberOfLines={1}>{selectedPlaylist.name}</Text>
                  <Text style={styles.playlistDetailCount}>{selectedPlaylist.tracks.length} canciones</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handlePlayPlaylist(selectedPlaylist)}
                  disabled={selectedPlaylist.tracks.length === 0}
                  style={[styles.playlistPlayBtn, selectedPlaylist.tracks.length === 0 && styles.playlistPlayBtnDisabled]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                </TouchableOpacity>
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
              <MaterialCommunityIcons name="music-note-plus" size={48} color="#3F4052" />
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
                    <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rightActionsRow}>
                  {isCurrent && (
                    <View style={styles.playingIndicator}>
                      <Text style={styles.playingIndicatorText}>SONANDO</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => onRemoveTrackFromPlaylist && onRemoveTrackFromPlaylist(selectedPlaylistId, item.mediaId)}
                    style={styles.addToQueueButton}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      );
    }

    // 2. Playlists List view
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
            <MaterialCommunityIcons name="playlist-music-outline" size={48} color="#3F4052" />
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
              <View style={styles.playlistIconWrapper}>
                <MaterialCommunityIcons name="playlist-music" size={26} color="#8B5CF6" />
              </View>
              <View style={styles.playlistRowDetails}>
                <Text style={styles.playlistRowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistRowSub}>{item.tracks.length} canciones</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.playlistRowActions}>
              <TouchableOpacity
                onPress={() => handlePlayPlaylist(item)}
                disabled={item.tracks.length === 0}
                style={[styles.playlistActionIconBtn, item.tracks.length === 0 && styles.playlistActionIconBtnDisabled]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="play" size={22} color={item.tracks.length === 0 ? "#3F4052" : "#A78BFA"} />
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
                style={styles.playlistActionIconBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  }

  // --- RENDER REGULAR MUSIC LIBRARY / QUEUE ---
  const listData = activeTab === 'library'
    ? (isLoading ? [] : displayTracks)
    : playQueue;

  return (
    <>
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

            {/* Google Drive Status Panel (only under private source library tab) */}
            {currentSource === 'private' && activeTab === 'library' && renderGoogleDrivePanel()}

            {/* Actions for local library */}
            {currentSource === 'local' && activeTab === 'library' && !isLoading && (
              <View style={styles.localActionsRow}>
                <TouchableOpacity onPress={onScanLocal} style={styles.actionButton} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="magnify" size={16} color="#A78BFA" />
                  <Text style={styles.actionButtonText}>Escanear Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onImportMp3} style={styles.actionButton} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="file-import-outline" size={16} color="#A78BFA" />
                  <Text style={styles.actionButtonText}>Importar MP3</Text>
                </TouchableOpacity>
                {hasCustomLocalTracks && (
                  <TouchableOpacity onPress={onResetLocal} style={[styles.actionButton, styles.resetButton]} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="cached" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Search Input (only visible in library view) */}
            {activeTab === 'library' && (currentSource === 'local' || (currentSource === 'private' && isDriveConnected)) && (
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

            {/* Section Header */}
            {activeTab === 'queue' && (playQueue || []).length > 0 && (
              <Text style={styles.queueHeader}>PISTAS EN COLA</Text>
            )}

            {/* Loading Indicator */}
            {isLoading && activeTab === 'library' && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Buscando pistas de audio...</Text>
              </View>
            )}

            {/* Empty state handlers */}
            {activeTab === 'library' && !isLoading && displayTracks.length === 0 && (
              <View style={styles.emptyWrapper}>
                <MaterialCommunityIcons name="music-off" size={48} color="#3F4052" />
                <Text style={styles.emptyText}>No se encontraron canciones</Text>
                {currentSource === 'local' && !searchQuery && (
                  <Text style={styles.emptySubText}>Usa "Escanear Audio" o "Importar MP3" para cargar música local.</Text>
                )}
                {currentSource === 'private' && isDriveConnected && !searchQuery && (
                  <Text style={styles.emptySubText}>No se encontraron archivos .mp3 en tu Google Drive.</Text>
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

              <View style={styles.rightActionsRow}>
                {isCurrent && (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingIndicatorText}>SONANDO</Text>
                  </View>
                )}
                {activeTab === 'library' ? (
                  <TouchableOpacity
                    onPress={() => setSelectedTrackForOptions(item)}
                    style={styles.addToQueueButton}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#8E8F9E" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => onRemoveFromQueue && onRemoveFromQueue(item, index)}
                    style={styles.addToQueueButton}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="close" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* TRACK OPTIONS MODAL */}
      <Modal
        visible={selectedTrackForOptions !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTrackForOptions(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTrackForOptions(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedTrackForOptions?.title}
            </Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {selectedTrackForOptions?.artist}
            </Text>
            
            <View style={styles.modalDivider} />

            <TouchableOpacity
              onPress={() => {
                if (onAddToQueue && selectedTrackForOptions) {
                  onAddToQueue(selectedTrackForOptions);
                }
                setSelectedTrackForOptions(null);
              }}
              style={styles.modalOption}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="playlist-plus" size={22} color="#A78BFA" />
              <Text style={styles.modalOptionText}>Añadir a la cola</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsPlaylistPickerVisible(true);
              }}
              style={styles.modalOption}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="playlist-music-outline" size={22} color="#A78BFA" />
              <Text style={styles.modalOptionText}>Añadir a una playlist...</Text>
            </TouchableOpacity>

            {!selectedTrackForOptions?.mediaId?.startsWith('drive-') && onUploadLocalTrackToDrive && (
              <TouchableOpacity
                onPress={() => {
                  const trackToUpload = selectedTrackForOptions;
                  setSelectedTrackForOptions(null);
                  onUploadLocalTrackToDrive(trackToUpload);
                }}
                style={styles.modalOption}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="#A78BFA" />
                <Text style={styles.modalOptionText}>Subir a Google Drive</Text>
              </TouchableOpacity>
            )}

            {selectedTrackForOptions?.mediaId?.startsWith('drive-') && onDeleteDriveTrack && (
              <TouchableOpacity
                onPress={() => {
                  const trackToDelete = selectedTrackForOptions;
                  setSelectedTrackForOptions(null);
                  Alert.alert(
                    'Eliminar Canción de Drive',
                    `¿Estás seguro de que quieres eliminar "${trackToDelete.title}" de tu Google Drive? Esta acción no se puede deshacer y también eliminará la canción de tus playlists y cola de reproducción.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => onDeleteDriveTrack(trackToDelete),
                      },
                    ]
                  );
                }}
                style={styles.modalOption}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Eliminar de Drive</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setSelectedTrackForOptions(null)}
              style={[styles.modalOption, styles.modalCancelOption]}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PLAYLIST PICKER MODAL */}
      <Modal
        visible={isPlaylistPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPlaylistPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsPlaylistPickerVisible(false);
            setSelectedTrackForOptions(null);
          }}
        >
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <Text style={styles.modalTitle}>Añadir a playlist</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              Selecciona una lista de reproducción
            </Text>

            <View style={styles.modalDivider} />

            {/* List of playlists */}
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ width: '100%', maxHeight: 240 }}
              ListEmptyComponent={
                <Text style={styles.emptyPlaylistsModalText}>No tienes playlists creadas.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={async () => {
                    if (onAddTrackToPlaylist && selectedTrackForOptions) {
                      await onAddTrackToPlaylist(item.id, selectedTrackForOptions);
                    }
                    setIsPlaylistPickerVisible(false);
                    setSelectedTrackForOptions(null);
                  }}
                  style={styles.playlistPickerOption}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="playlist-music" size={20} color="#8B5CF6" />
                  <Text style={styles.playlistPickerName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.playlistPickerCount}>
                    ({item.tracks.length})
                  </Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalDivider} />

            {/* Inline creation input inside picker */}
            <View style={styles.inlineCreateWrapper}>
              <TextInput
                placeholder="Nueva playlist..."
                placeholderTextColor="#5F6070"
                value={inlineNewPlaylistName}
                onChangeText={setInlineNewPlaylistName}
                style={styles.inlineCreateInput}
              />
              <TouchableOpacity
                onPress={handleCreateAndAdd}
                disabled={!inlineNewPlaylistName || inlineNewPlaylistName.trim() === ''}
                style={[styles.inlineCreateBtn, (!inlineNewPlaylistName || inlineNewPlaylistName.trim() === '') && styles.inlineCreateBtnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCreateBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsPlaylistPickerVisible(false);
                setSelectedTrackForOptions(null);
              }}
              style={[styles.modalOption, styles.modalCancelOption, { marginTop: 10 }]}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Atrás</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  driveHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    padding: 16,
    marginBottom: 20,
  },
  driveStatusCol: {
    flex: 1,
  },
  driveStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driveStatusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  driveInfoText: {
    color: '#8E8F9E',
    fontSize: 12,
    marginLeft: 28,
  },
  driveActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driveActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  driveUploadBtn: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  driveRefreshBtn: {
    backgroundColor: '#232433',
    borderColor: '#3B3D54',
  },
  driveDisconnectBtn: {
    backgroundColor: '#232433',
    borderColor: '#3B3D54',
  },
  driveConnectCard: {
    backgroundColor: '#161722',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    padding: 20,
    marginBottom: 20,
  },
  driveCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driveIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  driveCardTitleCol: {
    flex: 1,
  },
  driveCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  driveCardSubtitle: {
    color: '#8E8F9E',
    fontSize: 12,
    marginTop: 2,
  },
  driveDescriptionText: {
    color: '#8E8F9E',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  devWarningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  devWarningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 18,
  },
  driveConnectBtn: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  driveConnectBtnDisabled: {
    backgroundColor: '#2A2B3D',
    shadowOpacity: 0,
    elevation: 0,
  },
  driveConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Playlists specific styles
  playlistDetailContainer: {
    flex: 1,
  },
  playlistDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  playlistBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#12131A',
    borderWidth: 1,
    borderColor: '#1F202E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistDetailName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  playlistDetailCount: {
    color: '#5F6070',
    fontSize: 12,
    marginTop: 2,
  },
  playlistPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playlistPlayBtnDisabled: {
    backgroundColor: '#2A2B3D',
    shadowOpacity: 0,
    elevation: 0,
  },
  playlistsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  playlistsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  createPlaylistToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  createPlaylistToggleText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
  },
  createPlaylistInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F202E',
    paddingLeft: 12,
    paddingRight: 4,
    height: 48,
    marginBottom: 16,
  },
  createPlaylistInput: {
    flex: 1,
    color: '#E2E3E9',
    fontSize: 14,
    height: '100%',
  },
  createPlaylistBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createPlaylistBtnDisabled: {
    backgroundColor: '#2A2B3D',
  },
  createPlaylistBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#12131A',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  playlistRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  playlistRowDetails: {
    flex: 1,
  },
  playlistRowName: {
    color: '#E2E3E9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistRowSub: {
    color: '#5F6070',
    fontSize: 12,
  },
  playlistRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playlistActionIconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistActionIconBtnDisabled: {
    opacity: 0.3,
  },

  // Modal styles for Track Options & Playlist Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0C0D14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1F202E',
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  modalSubtitle: {
    color: '#8E8F9E',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#1F202E',
    width: '100%',
    marginVertical: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12131A',
    borderWidth: 1,
    borderColor: '#1F202E',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 14,
    marginBottom: 10,
    gap: 8,
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancelOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 6,
  },
  modalCancelText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyPlaylistsModalText: {
    color: '#5F6070',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 16,
  },
  playlistPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 32, 46, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    width: '100%',
    gap: 8,
  },
  playlistPickerName: {
    flex: 1,
    color: '#E2E3E9',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistPickerCount: {
    color: '#5F6070',
    fontSize: 12,
  },
  inlineCreateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F202E',
    paddingLeft: 12,
    paddingRight: 4,
    height: 44,
    width: '100%',
    marginTop: 4,
  },
  inlineCreateInput: {
    flex: 1,
    color: '#E2E3E9',
    fontSize: 13,
    height: '100%',
  },
  inlineCreateBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  inlineCreateBtnDisabled: {
    backgroundColor: '#2A2B3D',
  },
  inlineCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
