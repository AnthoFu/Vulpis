import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import styles from '../../styles/HistoryModal.styles';
import { Colors } from '../../constants/colors';
import { Track } from '../../models/Track';
import { PlaybackHistoryItem } from '../../models/History';
import { formatRelativeTime } from '../../utils/history';

export interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  historyItems?: PlaybackHistoryItem[];
  activeTrack?: Track | null;
  onSelectTrack?: (track: Track, index: number, playlistTracks?: Track[]) => void;
  onRemoveItem?: (id: string) => void;
  onClearHistory?: () => void;
  onAddToQueue?: (track: Track) => void;
}

const DEFAULT_COVER = Image.resolveAssetSource(
  require('../../../assets/default-cover.jpg')
).uri;

/**
 * Modal interactivo para visualizar, buscar y reproducir pistas del historial reciente.
 */
export default function HistoryModal({
  visible,
  onClose,
  historyItems = [],
  activeTrack,
  onSelectTrack,
  onRemoveItem,
  onClearHistory,
  onAddToQueue,
}: HistoryModalProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyItems;
    const query = searchQuery.toLowerCase().trim();
    return historyItems.filter((item) => {
      const title = item.track?.title?.toLowerCase() ?? '';
      const artist = item.track?.artist?.toLowerCase() ?? '';
      return title.includes(query) || artist.includes(query);
    });
  }, [historyItems, searchQuery]);

  if (!visible) return null;

  const handleConfirmClear = () => {
    if (historyItems.length === 0) return;
    Alert.alert(
      'Vaciar Historial',
      '¿Estás seguro de que querés borrar todas las canciones reproducidas recientemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => onClearHistory?.(),
        },
      ]
    );
  };

  const handlePlayItem = (item: PlaybackHistoryItem, index: number) => {
    if (!onSelectTrack) return;
    const historyTrackList = filteredHistory.map((h) => h.track);
    onSelectTrack(item.track, index, historyTrackList);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Barra superior de arrastre */}
              <View style={styles.handleBar} />

              {/* Encabezado */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.headerIconCircle}>
                    <MaterialCommunityIcons
                      name="history"
                      size={20}
                      color={Colors.accent}
                    />
                  </View>
                  <Text style={styles.title}>Historial</Text>
                  {historyItems.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{historyItems.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.headerActions}>
                  {historyItems.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={handleConfirmClear}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={13} color={Colors.textTertiary} />
                      <Text style={styles.clearButtonText}>Vaciar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Buscador dentro del historial */}
              {historyItems.length > 3 && (
                <View style={styles.searchContainer}>
                  <Feather name="search" size={15} color={Colors.textTertiary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar en el historial..."
                    placeholderTextColor={Colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Feather name="x-circle" size={14} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Lista de pistas reproducidas */}
              <FlatList
                data={filteredHistory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <MaterialCommunityIcons
                        name="clock-time-four-outline"
                        size={32}
                        color={Colors.textTertiary}
                      />
                    </View>
                    <Text style={styles.emptyTitle}>
                      {searchQuery
                        ? 'Sin coincidencias'
                        : 'Sin reproducciones recientes'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery
                        ? 'No se encontraron canciones en el historial para esta búsqueda.'
                        : 'Las canciones que escuches durante al menos 10 segundos aparecerán automáticamente acá.'}
                    </Text>
                  </View>
                }
                renderItem={({ item, index }) => {
                  const isCurrent = activeTrack?.mediaId === item.track?.mediaId;
                  const artworkUri = item.track?.artworkUrl || DEFAULT_COVER;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.historyRow,
                        isCurrent && styles.historyRowActive,
                      ]}
                      onPress={() => handlePlayItem(item, index)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: artworkUri }}
                        style={styles.artwork}
                        resizeMode="cover"
                      />

                      <View style={styles.trackInfoCol}>
                        <Text
                          style={[
                            styles.trackTitle,
                            isCurrent && styles.trackTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.track.title}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.trackArtist} numberOfLines={1}>
                            {item.track.artist}
                          </Text>
                          <Text style={styles.timeBullet}>•</Text>
                          <Text style={styles.timeText}>
                            {formatRelativeTime(item.playedAt)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemActions}>
                        {onAddToQueue && (
                          <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={() => onAddToQueue(item.track)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialCommunityIcons
                              name="playlist-plus"
                              size={20}
                              color={Colors.textTertiary}
                            />
                          </TouchableOpacity>
                        )}

                        {onRemoveItem && (
                          <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={() => onRemoveItem(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather
                              name="x"
                              size={16}
                              color={Colors.textTertiary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
