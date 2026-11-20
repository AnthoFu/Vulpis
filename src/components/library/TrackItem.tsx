import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import { Track } from '../../models/Track';

export function formatDuration(seconds?: number | null): string {
  if (!seconds || typeof seconds !== 'number' || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface TrackItemProps {
  item: Track;
  index: number;
  contextTracks?: Track[];
  showTrackNumber?: boolean;
  activeTrack?: Track | null;
  isProcessing?: boolean;
  defaultArtwork?: string;
  onSelectTrack?: (item: Track, index: number, contextTracks?: Track[]) => void;
  onOpenOptions?: (item: Track) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (item: Track) => void;
  onLongPress?: (item: Track) => void;
}

/**
 * Componente de fila individual para una canción en la biblioteca.
 */
export default function TrackItem({
  item,
  index,
  contextTracks,
  showTrackNumber = false,
  activeTrack,
  isProcessing = false,
  defaultArtwork,
  onSelectTrack,
  onOpenOptions,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onLongPress,
}: TrackItemProps): React.JSX.Element {
  const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
  const durStr = formatDuration(item.duration);

  const handlePress = () => {
    if (isSelectionMode) {
      onToggleSelect?.(item);
    } else if (onSelectTrack) {
      onSelectTrack(item, index, contextTracks);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(item);
    } else if (isSelectionMode && onToggleSelect) {
      onToggleSelect(item);
    }
  };

  return (
    <View
      key={`${item.mediaId}-${index}`}
      style={[
        styles.queueItem,
        isCurrent && styles.queueItemActive,
        isSelected && styles.queueItemSelected,
        isProcessing && styles.queueItemDisabled,
      ]}
    >
      {isSelectionMode && (
        <TouchableOpacity
          onPress={() => onToggleSelect?.(item)}
          style={styles.selectionCheckbox}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={isSelected ? '#8B5CF6' : '#6B7280'}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        disabled={isProcessing}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={styles.itemMainContent}
        activeOpacity={0.7}
      >
        {showTrackNumber ? (
          <View style={styles.trackNumberBadge}>
            <Text style={styles.trackNumberText}>{index + 1}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.artworkUrl || defaultArtwork }}
            style={styles.queueArtwork as any}
          />
        )}

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
        {!isSelectionMode && onOpenOptions && (
          <TouchableOpacity
            onPress={() => onOpenOptions(item)}
            style={styles.addToQueueButton}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#8E8F9E" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
