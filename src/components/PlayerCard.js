import React, { useState, useRef, useEffect } from 'react';
import { Text, View, Image, TouchableOpacity, FlatList, Animated, StyleSheet, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import styles from '../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import usePlayerCard from '../hooks/usePlayerCard';
import useSheetAnimation from '../hooks/useSheetAnimation';
import { SPRING, DURATION } from '../constants/animations';

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
  
  const {
    isQueueVisible,
    setIsQueueVisible,
    colorA,
    colorB,
    fadeAnim,
    defaultTrack,
    currentTrackTitle,
    currentTrackArtist,
    currentTrackArtwork,
    selectTrackFromQueue,
    togglePlayback,
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
  // Flag que indica si hay un drag activo: bloquea la sincronización del ref desde el prop
  // para evitar que re-renders intermedios sobreescriban los swaps manuales
  const isDragActiveRef = useRef(false);
  const playQueueRef = useRef(playQueue);
  // Solo sincronizar desde el prop cuando NO hay un drag activo
  if (!isDragActiveRef.current) {
    playQueueRef.current = playQueue;
  }

  const handleDragStart = (index, pageY) => {
    // NO llamar setState aquí: causaría re-render → FlatList desmonta el item → gesto muere
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

    // Activar feedback visual solo tras mover >8px (evita re-render prematuro que mata el gesto)
    if (!hasMoved.current && Math.abs(diffY) > 8) {
      hasMoved.current = true;
      setDraggingIndex(activeDragIndex.current);
      setScrollEnabled(false);
    }

    // Traslación continua y suave mientras el usuario mueve el dedo
    dragYAnim.setValue(diffY);

    const steps = Math.round(diffY / ITEM_HEIGHT);
    if (steps !== 0) {
      const currentIdx = activeDragIndex.current;
      let targetIdx = currentIdx + steps;
      const queue = playQueueRef.current || [];
      const queueLen = queue.length;

      // ── IMPORTANTE: leer el item arrastrado del ref sincrónico ──
      const draggedItem = queue[currentIdx];
      const isActive = draggedItem && activeTrack && draggedItem.mediaId === activeTrack.mediaId;
      targetIdx = Math.max(isActive ? 0 : 1, Math.min(targetIdx, queueLen - 1));


      if (targetIdx !== currentIdx) {
        // Actualizar playQueueRef sincrónicamente ANTES del re-render (fix stale ref)
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
    // Si hubo sync nativa, el polling se reanuda después del timeout de 600ms en handleSyncReorderNative

    hasMoved.current = false;
    isDragActiveRef.current = false; // Descongelar: el prop puede sincronizar el ref de nuevo
    originalDragIndex.current = null;
    activeDragIndex.current = null;
    setDraggingIndex(null);
    dragYAnim.setValue(0);
    setScrollEnabled(true);
  };

  const renderBackground = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Capa A (Color Base / Anterior) */}
        <LinearGradient
          colors={[colorA, '#090A0F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Capa B (Color de Destino, Desvaneciéndose) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colorB, '#090A0F']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        {/* Superposición oscura para asegurar que el texto sea siempre legible */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 10, 15, 0.4)' }]} />
      </View>
    );
  };  // Vista normal del reproductor en pantalla completa
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

        {/* Botón de controles de pie de página */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={styles.footerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={22} color="#8E8F9E" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Ver Cola de Reproducción</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUPERPOSICIÓN DE LA COLA DE REPRODUCCIÓN (ESTILO BOTTOM SHEET) */}
      {queueSheetVisible && (
        <View style={styles.bottomSheetOverlay}>
          {/* Backdrop táctil para cerrar */}
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
