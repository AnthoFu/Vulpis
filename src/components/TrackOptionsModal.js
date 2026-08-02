import React from 'react';
import { Text, View, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/QueueList.styles';

export default function TrackOptionsModal({
  visible,
  track,
  onClose,
  onAddToQueue,
  onAddPlaylistPress,
  onUploadLocalTrackToDrive,
  onDownloadDriveTrack,
  onDeleteDriveTrack,
  onDeleteLocalTrack,
}) {
  if (!track) return null;

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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.modalSubtitle} numberOfLines={1}>
            {track.artist}
          </Text>
          
          <View style={styles.modalDivider} />

          <TouchableOpacity
            onPress={() => {
              if (onAddToQueue) {
                onAddToQueue(track);
              }
              onClose();
            }}
            style={styles.modalOption}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-plus" size={22} color="#A78BFA" />
            <Text style={styles.modalOptionText}>Añadir a la cola</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (onAddPlaylistPress) {
                onAddPlaylistPress();
              }
            }}
            style={styles.modalOption}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-music-outline" size={22} color="#A78BFA" />
            <Text style={styles.modalOptionText}>Añadir a una playlist...</Text>
          </TouchableOpacity>

          {!track.mediaId?.startsWith('drive-') && onUploadLocalTrackToDrive && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onUploadLocalTrackToDrive(track);
              }}
              style={styles.modalOption}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="#A78BFA" />
              <Text style={styles.modalOptionText}>Subir a Google Drive</Text>
            </TouchableOpacity>
          )}

          {track.mediaId?.startsWith('drive-') && onDownloadDriveTrack && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onDownloadDriveTrack(track);
              }}
              style={styles.modalOption}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cloud-download-outline" size={22} color="#A78BFA" />
              <Text style={styles.modalOptionText}>Descargar al almacenamiento local</Text>
            </TouchableOpacity>
          )}

          {track.mediaId?.startsWith('drive-') && onDeleteDriveTrack && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                Alert.alert(
                  'Eliminar Canción de Drive',
                  `¿Estás seguro de que quieres eliminar "${track.title}" de tu Google Drive? Esta acción no se puede deshacer y también eliminará la canción de tus playlists y cola de reproducción.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => onDeleteDriveTrack(track),
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

          {!track.mediaId?.startsWith('drive-') && onDeleteLocalTrack && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                Alert.alert(
                  'Eliminar Canción del Dispositivo',
                  `¿Estás seguro de que quieres eliminar "${track.title}" de tu biblioteca local? Esto la borrará del almacenamiento de la app y la quitará de tus playlists y cola de reproducción.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => onDeleteLocalTrack(track),
                    },
                  ]
                );
              }}
              style={styles.modalOption}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
              <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Borrar del dispositivo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalOption, styles.modalCancelOption]}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
