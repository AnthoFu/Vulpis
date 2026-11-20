import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import { Track } from '../../models/Track';
import { AudioSource } from '../../hooks/useAppController';

export interface BatchActionBarProps {
  visible: boolean;
  selectedTracks: Track[];
  totalVisibleTracksCount: number;
  isDriveConnected?: boolean;
  currentSource?: AudioSource;
  bottomOffset?: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExitSelectionMode: () => void;
  onBatchUploadToDrive?: (tracks: Track[]) => void;
  onBatchDeleteFromDrive?: (tracks: Track[]) => void;
  onBatchDeleteLocal?: (tracks: Track[]) => void;
  onBatchAddToPlaylist?: (tracks: Track[]) => void;
  onBatchAddToQueue?: (tracks: Track[]) => void;
}

/**
 * Barra contextual flotante para acciones en lote (Batch Multi-Selection).
 */
export default function BatchActionBar({
  visible,
  selectedTracks,
  totalVisibleTracksCount,
  isDriveConnected = false,
  currentSource = 'local',
  bottomOffset = 16,
  onSelectAll,
  onClearSelection,
  onExitSelectionMode,
  onBatchUploadToDrive,
  onBatchDeleteFromDrive,
  onBatchDeleteLocal,
  onBatchAddToPlaylist,
  onBatchAddToQueue,
}: BatchActionBarProps): React.JSX.Element | null {
  if (!visible) return null;

  const count = selectedTracks.length;
  const isAllSelected = count > 0 && count === totalVisibleTracksCount;
  const hasDriveTracks = selectedTracks.some((t) => t.mediaId.startsWith('drive-'));
  const hasLocalTracks = selectedTracks.some((t) => !t.mediaId.startsWith('drive-'));

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {/* Cabecera superior con contador y selector masivo */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onExitSelectionMode}
            style={styles.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.countBadge}>
            {count} seleccionada{count === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={isAllSelected ? onClearSelection : onSelectAll}
          style={styles.toggleAllButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isAllSelected ? 'checkbox-blank-off-outline' : 'checkbox-multiple-marked-outline'}
            size={16}
            color="#A78BFA"
          />
          <Text style={styles.toggleAllText}>
            {isAllSelected ? 'Deseleccionar' : 'Todas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fila de acciones por lote */}
      <View style={styles.actionsRow}>
        {/* Subir a Drive (si hay pistas locales y Drive está conectado) */}
        {hasLocalTracks && isDriveConnected && onBatchUploadToDrive && (
          <TouchableOpacity
            disabled={count === 0}
            onPress={() => onBatchUploadToDrive(selectedTracks)}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={20}
              color={count > 0 ? '#A78BFA' : '#6B7280'}
            />
            <Text style={[styles.actionText, count === 0 && { color: '#6B7280' }]}>
              Subir a Drive
            </Text>
          </TouchableOpacity>
        )}

        {/* Borrar de Google Drive */}
        {hasDriveTracks && onBatchDeleteFromDrive && (
          <TouchableOpacity
            disabled={count === 0}
            onPress={() => onBatchDeleteFromDrive(selectedTracks)}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={20}
              color={count > 0 ? '#F87171' : '#6B7280'}
            />
            <Text
              style={[
                styles.actionText,
                styles.actionTextDanger,
                count === 0 && { color: '#6B7280' },
              ]}
            >
              Borrar Drive
            </Text>
          </TouchableOpacity>
        )}

        {/* Borrar del dispositivo (pistas locales) */}
        {hasLocalTracks && currentSource === 'local' && onBatchDeleteLocal && (
          <TouchableOpacity
            disabled={count === 0}
            onPress={() => onBatchDeleteLocal(selectedTracks)}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color={count > 0 ? '#F87171' : '#6B7280'}
            />
            <Text
              style={[
                styles.actionText,
                styles.actionTextDanger,
                count === 0 && { color: '#6B7280' },
              ]}
            >
              Eliminar
            </Text>
          </TouchableOpacity>
        )}

        {/* Añadir a Playlist en lote */}
        {onBatchAddToPlaylist && (
          <TouchableOpacity
            disabled={count === 0}
            onPress={() => onBatchAddToPlaylist(selectedTracks)}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="playlist-plus"
              size={22}
              color={count > 0 ? '#A78BFA' : '#6B7280'}
            />
            <Text style={[styles.actionText, count === 0 && { color: '#6B7280' }]}>
              A Playlist
            </Text>
          </TouchableOpacity>
        )}

        {/* Añadir a la Cola en lote */}
        {onBatchAddToQueue && (
          <TouchableOpacity
            disabled={count === 0}
            onPress={() => onBatchAddToQueue(selectedTracks)}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="playlist-play"
              size={22}
              color={count > 0 ? '#A78BFA' : '#6B7280'}
            />
            <Text style={[styles.actionText, count === 0 && { color: '#6B7280' }]}>
              A Cola
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
