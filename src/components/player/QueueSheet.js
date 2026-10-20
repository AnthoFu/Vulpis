import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../styles/QueueSheet.styles';
import useSheetAnimation from '../../hooks/useSheetAnimation';
import QueueItemRow from './QueueItemRow';

const ITEM_ROW_HEIGHT = 70; // 64px item height + 6px marginBottom


function QueueSheet({
  visible,
  onClose,
  activeTrack,
  isPlaying,
  playQueue = [],
  onSelectTrack,
  onRemoveFromQueue,
  onMoveQueueItem,
  onClearUpcomingQueue,
  onTogglePlayback,
  onDragActive,
}) {
  const insets = useSafeAreaInsets();
  const defaultArtwork = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

  const {
    visible: sheetVisible,
    translateY: sheetTranslateY,
    backdropOpacity,
  } = useSheetAnimation({ isOpen: visible });

  const [showPrevious, setShowPrevious] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const dragY = useRef(new Animated.Value(0)).current;
  const dragIndexRef = useRef(null);
  const hoverIndexRef = useRef(null);

  // Calcular índice activo dentro de la cola
  const activeIndex = useMemo(() => {
    if (!playQueue || playQueue.length === 0 || !activeTrack) return -1;
    const idx = playQueue.findIndex(t => t.mediaId === activeTrack.mediaId);
    return idx !== -1 ? idx : 0;
  }, [playQueue, activeTrack]);

  const currentItem = activeIndex >= 0 && activeIndex < playQueue.length
    ? playQueue[activeIndex]
    : activeTrack;

  // Pistas siguientes ("A continuación")
  const upcomingTracks = useMemo(() => {
    if (!playQueue || playQueue.length === 0 || activeIndex === -1) return [];
    return playQueue.slice(activeIndex + 1);
  }, [playQueue, activeIndex]);

  // Pistas anteriores
  const previousTracks = useMemo(() => {
    if (!playQueue || playQueue.length === 0 || activeIndex <= 0) return [];
    return playQueue.slice(0, activeIndex);
  }, [playQueue, activeIndex]);

  const upcomingCountRef = useRef(upcomingTracks.length);
  upcomingCountRef.current = upcomingTracks.length;

  const handleStartDrag = useCallback((index) => {
    console.log(`[QueueSheet] 🟢 Inició arrastre en índice local: ${index} ("${upcomingTracks[index]?.title}")`);
    dragIndexRef.current = index;
    hoverIndexRef.current = index;
    setDraggingIndex(index);
    setHoverIndex(index);
    setScrollEnabled(false);
    dragY.setValue(0);
    if (onDragActive) onDragActive(true);
  }, [dragY, onDragActive, upcomingTracks]);

  const handleMoveDrag = useCallback((dy) => {
    if (dragIndexRef.current === null) return;
    dragY.setValue(dy);
    const offset = Math.round(dy / ITEM_ROW_HEIGHT);
    const target = Math.max(0, Math.min(upcomingCountRef.current - 1, dragIndexRef.current + offset));
    if (hoverIndexRef.current !== target) {
      hoverIndexRef.current = target;
      setHoverIndex(target);
    }
  }, [dragY]);

  const handleEndDrag = useCallback(() => {
    const from = dragIndexRef.current;
    const to = hoverIndexRef.current;
    console.log(`[QueueSheet] 🏁 Fin de arrastre: origen local=${from}, destino local=${to}`);
    dragIndexRef.current = null;
    hoverIndexRef.current = null;
    setDraggingIndex(null);
    setHoverIndex(null);
    dragY.setValue(0);
    setScrollEnabled(true);

    if (from !== null && to !== null && from !== to && onMoveQueueItem) {
      const globalFrom = activeIndex + 1 + from;
      const globalTo = activeIndex + 1 + to;
      console.log(`[QueueSheet] 🚀 Solicitando mover pista: global ${globalFrom} -> ${globalTo}`);
      onMoveQueueItem(globalFrom, globalTo);
    } else {
      if (onDragActive) onDragActive(false);
    }
  }, [activeIndex, onMoveQueueItem, dragY, onDragActive]);

  const handleQuickMoveUp = useCallback((localIndex) => {
    if (localIndex <= 0 || !onMoveQueueItem) return;
    const globalFrom = activeIndex + 1 + localIndex;
    const globalTo = activeIndex + 1 + (localIndex - 1);
    console.log(`[QueueSheet] 🔼 Subir pista: global ${globalFrom} -> ${globalTo}`);
    onMoveQueueItem(globalFrom, globalTo);
  }, [activeIndex, onMoveQueueItem]);

  const handleQuickMoveDown = useCallback((localIndex) => {
    if (localIndex >= upcomingTracks.length - 1 || !onMoveQueueItem) return;
    const globalFrom = activeIndex + 1 + localIndex;
    const globalTo = activeIndex + 1 + (localIndex + 1);
    console.log(`[QueueSheet] 🔽 Bajar pista: global ${globalFrom} -> ${globalTo}`);
    onMoveQueueItem(globalFrom, globalTo);
  }, [activeIndex, upcomingTracks.length, onMoveQueueItem]);

  const handleRemove = useCallback((item, localIndex) => {
    if (!onRemoveFromQueue) return;
    const globalIndex = activeIndex + 1 + localIndex;
    console.log(`[QueueSheet] 🗑️ Eliminar pista en índice global ${globalIndex}: "${item.title}"`);
    onRemoveFromQueue(item, globalIndex);
  }, [activeIndex, onRemoveFromQueue]);

  const handleSelectUpcoming = useCallback((item, localIndex) => {
    if (!onSelectTrack) return;
    const globalIndex = activeIndex + 1 + localIndex;
    console.log(`[QueueSheet] ▶️ Seleccionada pista siguiente en índice global ${globalIndex}: "${item.title}"`);
    onSelectTrack(globalIndex, item);
  }, [activeIndex, onSelectTrack]);

  const handleSelectPrevious = useCallback((item, localIndex) => {
    if (!onSelectTrack) return;
    console.log(`[QueueSheet] ⏪ Seleccionada pista anterior en índice global ${localIndex}: "${item.title}"`);
    onSelectTrack(localIndex, item);
  }, [onSelectTrack]);

  const handleClearConfirm = () => {
    Alert.alert(
      'Vaciar cola',
      '¿Deseas eliminar todas las canciones siguientes de la cola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => {
            console.log('[QueueSheet] 🧹 Confirmado vaciar cola');
            if (onClearUpcomingQueue) onClearUpcomingQueue();
          },
        },
      ]
    );
  };

  if (!sheetVisible) return null;

  return (
    <View style={styles.bottomSheetOverlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.bottomSheetBackdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheetContent,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Barra superior visual */}
        <View style={styles.bottomSheetHandleWrapper}>
          <View style={styles.bottomSheetHandle} />
        </View>

        {/* Fila de encabezado */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Fila de reproducción</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#8E8F9E" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={styles.listContent}
        >
          {/* SECCIÓN 1: REPRODUCIENDO AHORA (FIJA) */}
          {currentItem ? (
            <View style={styles.nowPlayingCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Reproduciendo ahora</Text>
                <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" />
              </View>
              <View style={styles.nowPlayingContent}>
                <Image
                  source={{ uri: currentItem.artworkUrl || defaultArtwork }}
                  style={styles.nowPlayingArtwork}
                />
                <View style={styles.nowPlayingDetails}>
                  <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                    {currentItem.title}
                  </Text>
                  <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                    {currentItem.artist}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onTogglePlayback}
                  style={styles.playPauseCircle}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? "pause" : "play"}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* SECCIÓN 2: A CONTINUACIÓN */}
          <View style={styles.upcomingHeaderRow}>
            <Text style={styles.sectionTitle}>
              A continuación {upcomingTracks.length > 0 ? `(${upcomingTracks.length})` : ''}
            </Text>
            {upcomingTracks.length > 0 && onClearUpcomingQueue && (
              <TouchableOpacity
                onPress={handleClearConfirm}
                style={styles.clearQueueBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="playlist-remove" size={15} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.clearQueueText}>Vaciar cola</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="music-note-plus" size={30} color="#A78BFA" />
              </View>
              <Text style={styles.emptyTitle}>No hay más canciones en la cola</Text>
              <Text style={styles.emptySub}>
                Añade canciones desde la biblioteca pulsando en los tres puntos (•••) de cualquier pista.
              </Text>
            </View>
          ) : (
            upcomingTracks.map((item, index) => {
              const isDragging = draggingIndex === index;
              let shiftY = 0;
              if (draggingIndex !== null && hoverIndex !== null) {
                if (hoverIndex > draggingIndex) {
                  if (index > draggingIndex && index <= hoverIndex) {
                    shiftY = -ITEM_ROW_HEIGHT;
                  }
                } else if (hoverIndex < draggingIndex) {
                  if (index >= hoverIndex && index < draggingIndex) {
                    shiftY = ITEM_ROW_HEIGHT;
                  }
                }
              }

              return (
                <QueueItemRow
                  key={item.queueId || `${item.mediaId || item.url || 'q'}-${item._addedAt || index}`}
                  item={item}
                  index={index}
                  isDragging={isDragging}
                  dragY={dragY}
                  shiftY={shiftY}
                  defaultArtwork={defaultArtwork}
                  onStartDrag={handleStartDrag}
                  onMoveDrag={handleMoveDrag}
                  onEndDrag={handleEndDrag}
                  onQuickMoveUp={handleQuickMoveUp}
                  onQuickMoveDown={handleQuickMoveDown}
                  onRemove={handleRemove}
                  onSelect={handleSelectUpcoming}
                  isFirst={index === 0}
                  isLast={index === upcomingTracks.length - 1}
                />
              );
            })
          )}

          {/* SECCIÓN 3: PISTAS ANTERIORES (HISTORIAL DESPLEGABLE) */}
          {previousTracks.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setShowPrevious(!showPrevious)}
                style={styles.previousHeaderBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.previousTitle}>
                  Anteriores ({previousTracks.length})
                </Text>
                <MaterialCommunityIcons
                  name={showPrevious ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6B6C80"
                />
              </TouchableOpacity>

              {showPrevious && (
                <View style={styles.previousListContainer}>
                  {previousTracks.map((item, index) => (
                    <TouchableOpacity
                      key={item.queueId || `${item.mediaId || item.url}-prev-${index}`}
                      onPress={() => handleSelectPrevious(item, index)}
                      style={styles.previousItem}
                      activeOpacity={0.6}
                    >
                      <Image
                        source={{ uri: item.artworkUrl || defaultArtwork }}
                        style={styles.previousItemArtwork}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.previousItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.previousItemArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="history" size={16} color="#6B6C80" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default React.memo(QueueSheet);
