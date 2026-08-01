import React from 'react';
import { Text, View, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/QueueList.styles';

export default function PlaylistPickerModal({
  visible,
  playlists,
  track,
  onClose,
  onAddTrackToPlaylist,
  inlineNewPlaylistName,
  setInlineNewPlaylistName,
  handleCreateAndAdd,
}) {
  if (!visible) return null;

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
                  if (onAddTrackToPlaylist && track) {
                    await onAddTrackToPlaylist(item.id, track);
                  }
                  onClose();
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
