import React, { useState, useRef, useEffect } from 'react';
import { Text, View, Image, TouchableOpacity, FlatList, Animated, StyleSheet, Modal, TouchableWithoutFeedback, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import styles from '../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import usePlayerCard from '../hooks/usePlayerCard';
import useSheetAnimation from '../hooks/useSheetAnimation';
import { SPRING, DURATION } from '../constants/animations';
import { parseLrcLyrics } from '../utils/metadata';
import EditLyricsModal from './EditLyricsModal';

export default function PlayerCard({
  activeTrack,
  isPlaying,
  position,
  duration,
  repeatMode,
  isShuffleActive,
  tracks,
  playQueue,
  onRemoveFromQueue,
  onReorderQueueState,
  onSyncReorderNative,
  onDragActive,
  onClose,
  onSelectTrack,
  initialQueueVisible = false,
}) {
  const insets = useSafeAreaInsets();
  const [isEditLyricsVisible, setIsEditLyricsVisible] = useState(false);
  
  const {
    isQueueVisible,
    setIsQueueVisible,
    isLyricsVisible,
    setIsLyricsVisible,
    lyricsText,
    rawLyrics,
    isLoadingLyrics,
    colorA,
    colorB,
    fadeAnim,
    defaultTrack,
    currentTrackTitle,
    currentTrackArtist,
    currentTrackArtwork,
    selectTrackFromQueue,
    togglePlayback,
    handleSaveCustomLyrics,
    handleResetCustomLyrics,
    handleFetchOnlineLyricsForce,
  } = usePlayerCard({
    activeTrack,
    tracks,
    initialQueueVisible,
  });

  const {
    visible: queueSheetVisible,
    translateY: queueTranslateY,
    backdropOpacity: queueBackdropOpacity,
  } = useSheetAnimation({ isOpen: isQueueVisible });

  const {
    visible: lyricsSheetVisible,
    translateY: lyricsTranslateY,
    backdropOpacity: lyricsBackdropOpacity,
  } = useSheetAnimation({ isOpen: isLyricsVisible });

  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const playerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(playerSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      ...SPRING.gentle,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(playerSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: DURATION.fast,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const originalDragIndex = useRef(null);
  const activeDragIndex = useRef(null);
  const dragStartY = useRef(0);
  const dragYAnim = useRef(new Animated.Value(0)).current;
  const hasMoved = useRef(false);
  const isDragActiveRef = useRef(false);
  const playQueueRef = useRef(playQueue);
  if (!isDragActiveRef.current) {
    playQueueRef.current = playQueue;
  }

  const handleDragStart = (index, pageY) => {
    originalDragIndex.current = index;
    activeDragIndex.current = index;
    dragStartY.current = pageY;
    hasMoved.current = false;
    isDragActiveRef.current = true;
    dragYAnim.setValue(0);
    if (onDragActive) onDragActive(true);
  };

  const handleDragMove = (pageY) => {
    if (activeDragIndex.current === null) return;

    const ITEM_HEIGHT = 62;
    const diffY = pageY - dragStartY.current;

    if (!hasMoved.current && Math.abs(diffY) > 8) {
      hasMoved.current = true;
      setDraggingIndex(activeDragIndex.current);
      setScrollEnabled(false);
    }

    dragYAnim.setValue(diffY);

    const steps = Math.round(diffY / ITEM_HEIGHT);
    if (steps !== 0) {
      const currentIdx = activeDragIndex.current;
      let targetIdx = currentIdx + steps;
      const queue = playQueueRef.current || [];
      const queueLen = queue.length;

      const draggedItem = queue[currentIdx];
      const isActive = draggedItem && activeTrack && draggedItem.mediaId === activeTrack.mediaId;
      targetIdx = Math.max(isActive ? 0 : 1, Math.min(targetIdx, queueLen - 1));

      if (targetIdx !== currentIdx) {
        const updatedQueue = [...queue];
        const [moved] = updatedQueue.splice(currentIdx, 1);
        updatedQueue.splice(targetIdx, 0, moved);
        playQueueRef.current = updatedQueue;

        if (onReorderQueueState) onReorderQueueState(currentIdx, targetIdx);
        activeDragIndex.current = targetIdx;
        setDraggingIndex(targetIdx);
        dragStartY.current = pageY;
        dragYAnim.setValue(0);
      }
    }
  };

  const handleDragEnd = () => {
    const from = originalDragIndex.current;
    const to = activeDragIndex.current;

    if (hasMoved.current && from !== null && to !== null && from !== to) {
      if (onSyncReorderNative) onSyncReorderNative(playQueueRef.current);
    } else {
      if (onDragActive) onDragActive(false);
    }

    hasMoved.current = false;
    isDragActiveRef.current = false;
    originalDragIndex.current = null;
    activeDragIndex.current = null;
    setDraggingIndex(null);
    dragYAnim.setValue(0);
    setScrollEnabled(true);
  };

  const renderBackground = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colorA, '#090A0F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colorB, '#090A0F']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 10, 15, 0.4)' }]} />
      </View>
    );
  };

  const parsedLines = parseLrcLyrics(rawLyrics);
  let activeLyricLine = null;
  if (parsedLines && parsedLines.length > 0) {
    const hasTimestamps = parsedLines.some(l => l.time !== null);
    if (hasTimestamps) {
      for (let i = 0; i < parsedLines.length; i++) {
        const item = parsedLines[i];
        if (item.time !== null && position >= item.time) {
          activeLyricLine = item.text;
        }
      }
    } else if (lyricsText) {
      activeLyricLine = lyricsText.split('\n').find(line => line.trim().length > 0) || null;
    }
  }

  const lyricFadeAnim = useRef(new Animated.Value(1)).current;
  const prevLyricRef = useRef(activeLyricLine);

  useEffect(() => {
    if (prevLyricRef.current !== activeLyricLine) {
      prevLyricRef.current = activeLyricLine;
      lyricFadeAnim.setValue(0);
      Animated.timing(lyricFadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }).start();
    }
  }, [activeLyricLine]);

  return (
    <Animated.View
      style={[
        styles.playerFullScreen,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20),
          transform: [{ translateY: playerSlideAnim }],
        },
      ]}
    >
      {renderBackground()}
      {/* Fila de encabezado */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SONANDO AHORA</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Sección de portada con contenedor de sombra */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkShadowWrapper}>
          <Image
            source={{ uri: currentTrackArtwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        </View>
      </View>
      
      {/* Detalles de la pista, progreso y controles */}
      <View style={styles.bottomSection}>
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrackTitle}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrackArtist}
          </Text>

          {activeLyricLine && (
            <Animated.View
              style={{
                opacity: lyricFadeAnim,
                transform: [
                  {
                    translateY: lyricFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
                width: '100%',
              }}
            >
              <TouchableOpacity 
                onPress={() => setIsLyricsVisible(true)}
                activeOpacity={0.8}
                style={styles.liveLyricContainer}
              >
                <MaterialCommunityIcons name="microphone-variant" size={14} color="rgba(167, 139, 250, 0.7)" style={{ marginRight: 6 }} />
                <Text style={styles.liveLyricText} numberOfLines={1}>
                  {activeLyricLine}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <ProgressBar position={position} duration={duration} />
        
        <Controls
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          isShuffleActive={isShuffleActive}
          tracks={tracks}
          playQueue={playQueue}
          activeTrack={activeTrack}
          onSelectTrack={onSelectTrack}
        />

        {/* Botones de pie de página: Letras y Cola */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => setIsLyricsVisible(true)}
            style={[styles.footerButton, { marginRight: 12 }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="microphone-variant" size={18} color="#A78BFA" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Letras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={styles.footerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={20} color="#8E8F9E" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Cola</Text>
          </TouchableOpacity>
        </View>
      </View>

      {lyricsSheetVisible && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsLyricsVisible(false)}>
            <Animated.View style={[styles.bottomSheetBackdrop, { opacity: lyricsBackdropOpacity }]} />
          </TouchableWithoutFeedback>
          
          <Animated.View
            style={[
              styles.lyricsSheetContent,
              {
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: lyricsTranslateY }],
              },
            ]}
          >
            <View style={styles.bottomSheetHandleWrapper}>
              <View style={styles.bottomSheetHandle} />
            </View>

            <View style={styles.lyricsHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.lyricsTitle} numberOfLines={1}>Letras</Text>
                <Text style={styles.lyricsTrackSub} numberOfLines={1}>
                  {currentTrackTitle} • {currentTrackArtist}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setIsEditLyricsVisible(true)}
                  style={styles.lyricsCloseBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={22} color="#A78BFA" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsLyricsVisible(false)}
                  style={styles.lyricsCloseBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#8E8F9E" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.lyricsScrollView}
              contentContainerStyle={styles.lyricsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingLyrics ? (
                <View style={styles.lyricsLoadingContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.lyricsLoadingText}>Cargando letra de la canción...</Text>
                </View>
              ) : lyricsText ? (
                (() => {
                  const parsedLines = parseLrcLyrics(rawLyrics);
                  const hasTimestamps = parsedLines.some(l => l.time !== null);

                  if (hasTimestamps) {
                    let activeIndex = -1;
                    for (let i = 0; i < parsedLines.length; i++) {
                      const item = parsedLines[i];
                      if (item.time !== null && position >= item.time) {
                        activeIndex = i;
                      }
                    }

                    return (
                      <View>
                        {parsedLines.map((line, idx) => {
                          const isActive = idx === activeIndex;
                          return (
                            <Text
                              key={idx}
                              style={[
                                styles.lyricLineText,
                                isActive && styles.lyricLineActiveText,
                              ]}
                            >
                              {line.text}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.lyricsBodyText}>
                      {lyricsText}
                    </Text>
                  );
                })()
              ) : (
                <View style={styles.emptyLyricsContainer}>
                  <View style={styles.emptyLyricsIconCircle}>
                    <MaterialCommunityIcons name="microphone-off" size={36} color="#A78BFA" />
                  </View>
                  <Text style={styles.emptyLyricsTitle}>Parece que no hay letras para esta canción</Text>
                  <Text style={styles.emptyLyricsSub}>
                    No se encontraron letras integradas en los metadatos de esta canción ni en línea.
                  </Text>
                  <TouchableOpacity
                    style={styles.addLyricsBtn}
                    onPress={() => setIsEditLyricsVisible(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                    <Text style={styles.addLyricsBtnText}>Escribir o editar letra</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      <EditLyricsModal
        visible={isEditLyricsVisible}
        onClose={() => setIsEditLyricsVisible(false)}
        initialLyrics={rawLyrics}
        trackTitle={currentTrackTitle}
        trackArtist={currentTrackArtist}
        onSave={handleSaveCustomLyrics}
        onReset={handleResetCustomLyrics}
        onFetchOnline={handleFetchOnlineLyricsForce}
      />

      {queueSheetVisible && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsQueueVisible(false)}>
            <Animated.View style={[styles.bottomSheetBackdrop, { opacity: queueBackdropOpacity }]} />
          </TouchableWithoutFeedback>
          
          {/* Contenido del Bottom Sheet */}
          <Animated.View
            style={[
              styles.bottomSheetContent,
              {
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: queueTranslateY }],
              },
            ]}
          >
            {/* Barra de arrastre superior visual */}
            <View style={styles.bottomSheetHandleWrapper}>
              <View style={styles.bottomSheetHandle} />
            </View>

            {/* Fila de encabezado estilo Spotify */}
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Fila de reproducción</Text>
            </View>
            
            {/* Lista deslizable de la cola */}
            <FlatList
              data={playQueue || []}
              scrollEnabled={scrollEnabled}
              keyExtractor={(item) => item.mediaId}
              contentContainerStyle={styles.queueListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrapper}>
                  <View style={styles.emptyIconContainer}>
                    <MaterialCommunityIcons name="playlist-remove" size={32} color="#A78BFA" />
                  </View>
                  <Text style={styles.emptyText}>La cola está vacía</Text>
                  <Text style={styles.emptySubText}>Agrega canciones a la cola de reproducción desde la biblioteca.</Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
                const isDragging = draggingIndex === index;
                const containerStyle = [
                  styles.queueItem,
                  isCurrent && styles.queueItemActive,
                  isDragging && {
                    transform: [{ translateY: dragYAnim }],
                    zIndex: 100,
                    backgroundColor: 'rgba(139, 92, 246, 0.18)',
                    borderColor: 'rgba(139, 92, 246, 0.4)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 5,
                  }
                ];
                return (
                  <Animated.View style={containerStyle}>
                    <TouchableOpacity
                      disabled={isCurrent}
                      onPress={() => selectTrackFromQueue(index)}
                      style={styles.queueItemMainContent}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: item.artworkUrl || defaultTrack.artworkUrl }} style={styles.queueArtwork} />
                      <View style={styles.queueDetails}>
                        <View style={styles.queueTitleRow}>
                          {isCurrent && (
                            <MaterialCommunityIcons name="volume-high" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
                          )}
                          <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>
                        <Text style={styles.queueArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isCurrent ? (
                      <TouchableOpacity
                        onPress={() => togglePlayback(isPlaying)}
                        style={styles.activePlayCircle}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name={isPlaying ? "pause" : "play"} size={16} color="#000000" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.rightActionsRow}>
                        <TouchableOpacity
                          onPress={() => onRemoveFromQueue && onRemoveFromQueue(item, index)}
                          style={styles.removeButton}
                          activeOpacity={0.6}
                        >
                          <MaterialCommunityIcons name="close" size={20} color="#8E8F9E" />
                        </TouchableOpacity>
                        <View
                          onStartShouldSetResponder={() => true}
                          onMoveShouldSetResponder={() => true}
                          onResponderTerminationRequest={() => false}
                          onResponderGrant={(evt) => {
                            handleDragStart(index, evt.nativeEvent.pageY);
                          }}
                          onResponderMove={(evt) => {
                            handleDragMove(evt.nativeEvent.pageY);
                          }}
                          onResponderRelease={handleDragEnd}
                          onResponderTerminate={handleDragEnd}
                          style={{
                            paddingLeft: 10,
                            paddingRight: 4,
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <MaterialCommunityIcons name="reorder-horizontal" size={20} color="#5F6070" />
                        </View>
                      </View>
                    )}
                  </Animated.View>
                );
              }}
            />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

