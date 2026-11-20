import React from 'react';
import { Text, View, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import { Track } from '../../models/Track';
import { Playlist } from '../../models/Playlist';

export interface PlaylistPickerModalProps {
  visible: boolean;
  playlists: Playlist[];
  track?: Track | null;
  tracks?: Track[];
  onClose: () => void;
  onAddTrackToPlaylist?: (playlistId: string, track: Track) => Promise<void> | void;
  onAddBatchTracksToPlaylist?: (playlistId: string, tracks: Track[]) => Promise<void> | void;
  inlineNewPlaylistName: string;
  setInlineNewPlaylistName: (name: string) => void;
  handleCreateAndAdd: () => void;
}

/**
 * Modal para seleccionar o crear una lista de reproducción y añadir una o varias pistas.
 */
export default function PlaylistPickerModal({
  visible,
  playlists,
  track,
  tracks,
  onClose,
  onAddTrackToPlaylist,
  onAddBatchTracksToPlaylist,
  inlineNewPlaylistName,
  setInlineNewPlaylistName,
  handleCreateAndAdd,
}: PlaylistPickerModalProps): React.JSX.Element | null {
  if (!visible) return null;

  const isBatch = Boolean(tracks && tracks.length > 0);
  const subtitle = isBatch
    ? `Añadir ${tracks?.length} canciones seleccionadas`
    : 'Selecciona una lista de reproducción';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { maxHeight: '75%' }]}>
          <Text style={styles.modalTitle}>Añadir a playlist</Text>
          <Text style={styles.modalSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.modalDivider} />

          {/* Lista de playlists */}
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
                  if (isBatch && onAddBatchTracksToPlaylist && tracks && tracks.length > 0) {
                    await onAddBatchTracksToPlaylist(item.id, tracks);
                  } else if (onAddTrackToPlaylist && track) {
                    await onAddTrackToPlaylist(item.id, track);
                  }
                  onClose();
                }}
                style={styles.playlistPickerOption}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.isFavorites || item.id === 'favorites' ? 'heart' : 'playlist-music'}
                  size={20}
                  color={item.isFavorites || item.id === 'favorites' ? '#EF4444' : '#8B5CF6'}
                />
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

          {/* Campo para crear playlist dentro del selector */}
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
              style={[
                styles.inlineCreateBtn,
                (!inlineNewPlaylistName || inlineNewPlaylistName.trim() === '') &&
                  styles.inlineCreateBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineCreateBtnText}>Crear</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalOption, styles.modalCancelOption, { marginTop: 10 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Atrás</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
