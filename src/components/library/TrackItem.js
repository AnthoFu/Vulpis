import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';

export function formatDuration(seconds) {
  if (!seconds || typeof seconds !== 'number' || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
}) {
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
        onPress={() => onSelectTrack && onSelectTrack(item, index, contextTracks)}
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
            style={styles.queueArtwork}
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
        <TouchableOpacity
          onPress={() => onOpenOptions && onOpenOptions(item)}
          style={styles.addToQueueButton}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#8E8F9E" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
