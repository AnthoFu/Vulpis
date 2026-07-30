import React, { useState, useEffect } from 'react';
import {
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
import styles from '../styles/QueueList.styles';
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
  onDownloadDriveTrack,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  // Estados de las listas de reproducción
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [isPlaylistPickerVisible, setIsPlaylistPickerVisible] = useState(false);
  const [inlineNewPlaylistName, setInlineNewPlaylistName] = useState('');

  // Restablecer la lista de reproducción seleccionada si cambia la fuente
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
      console.error('Error al seleccionar la pista:', e);
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
      console.error('Error al reproducir la lista de reproducción:', e);
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

  // Filtrar pistas de la biblioteca según la consulta de búsqueda
  const displayTracks = (tracks || []).filter((track) => {
    if (!searchQuery) return true;
    const title = (track.title || '').toLowerCase();
    const artist = (track.artist || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || artist.includes(query);
  });

  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  // --- MODO DE RENDERIZADO DE BÚSQUEDA DE PLAYLISTS ---
  if (currentSource === 'playlists') {
    const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
    const horizontalPadding = {
      paddingLeft: contentContainerStyle?.paddingLeft ?? 20,
      paddingRight: contentContainerStyle?.paddingRight ?? 20,
    };

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

            {/* Actions for local library */}
            {currentSource === 'local' && !isLoading && (
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

            {selectedTrackForOptions?.mediaId?.startsWith('drive-') && onDownloadDriveTrack && (
              <TouchableOpacity
                onPress={() => {
                  const trackToDownload = selectedTrackForOptions;
                  setSelectedTrackForOptions(null);
                  onDownloadDriveTrack(trackToDownload);
                }}
                style={styles.modalOption}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cloud-download-outline" size={22} color="#A78BFA" />
                <Text style={styles.modalOptionText}>Descargar al almacenamiento local</Text>
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


