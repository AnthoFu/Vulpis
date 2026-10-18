import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Text, View, Image, TouchableOpacity, FlatList, Animated, StyleSheet, Modal, TouchableWithoutFeedback, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import styles from '../../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import usePlayerCard from '../../hooks/usePlayerCard';
import useSheetAnimation from '../../hooks/useSheetAnimation';
import { SPRING, DURATION } from '../../constants/animations';
import { parseLrcLyrics } from '../../utils/metadata';
import TrackPlayer from '@rntp/player';
import EditLyricsModal from '../modals/EditLyricsModal';
import SleepTimerModal from '../modals/SleepTimerModal';
import QueueSheet from './QueueSheet';

export default function PlayerCard({
  activeTrack,
  isPlaying,
  position,
  duration,
  repeatMode,
  isShuffleActive,
  tracks,
  playQueue,
  isFavorite = false,
  onToggleFavorite,
  onRemoveFromQueue,
  onMoveQueueItem,
  onClearUpcomingQueue,
  onReorderQueueState,
  onSyncReorderNative,
  onDragActive,
  onClose,
  onSelectTrack,
  initialQueueVisible = false,
  isTimerActive = false,
  timerMode = null,
  timeRemainingFormatted = null,
  onSelectTimer,
  onCancelTimer,
  crossfadeSettings,
}) {
  const insets = useSafeAreaInsets();
  const [isEditLyricsVisible, setIsEditLyricsVisible] = useState(false);
  const [isSleepTimerVisible, setIsSleepTimerVisible] = useState(false);
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  
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

  const handleCloseQueue = useCallback(() => {
    setIsQueueVisible(false);
  }, [setIsQueueVisible]);

  const handleTogglePlaybackFromQueue = useCallback(() => {
    togglePlayback(isPlaying);
  }, [togglePlayback, isPlaying]);

  const handleHeartPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScaleAnim, {
        toValue: 1.4,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(heartScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (onToggleFavorite) {
      onToggleFavorite();
    }
  }, [onToggleFavorite, heartScaleAnim]);

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

  const lyricsScrollRef = useRef(null);
  const lineLayoutsRef = useRef({});
  const containerHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const parsedLines = useMemo(() => parseLrcLyrics(rawLyrics), [rawLyrics]);
  const hasTimestamps = useMemo(() => parsedLines.some(l => l.time !== null), [parsedLines]);

  const activeIndex = useMemo(() => {
    if (!hasTimestamps || parsedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      const item = parsedLines[i];
      if (item.time !== null && position >= item.time) {
        idx = i;
      }
    }
    return idx;
  }, [hasTimestamps, parsedLines, position]);

  const activeLyricLine = useMemo(() => {
    if (activeIndex >= 0 && activeIndex < parsedLines.length) {
      return parsedLines[activeIndex].text;
    }
    if (lyricsText) {
      return lyricsText.split('\n').find(line => line.trim().length > 0) || null;
    }
    return null;
  }, [activeIndex, parsedLines, lyricsText]);

  const scrollToActiveLine = useCallback((indexToScroll = activeIndex, animated = true) => {
    if (indexToScroll < 0 || !lyricsScrollRef.current) return;
    const layout = lineLayoutsRef.current[indexToScroll];
    if (!layout) {
      setTimeout(() => {
        const retryLayout = lineLayoutsRef.current[indexToScroll];
        if (retryLayout && lyricsScrollRef.current && !isUserScrollingRef.current) {
          const containerH = containerHeightRef.current || 400;
          const targetY = Math.max(0, retryLayout.y - containerH * 0.32 + retryLayout.height / 2);
          lyricsScrollRef.current?.scrollTo({ y: targetY, animated });
        }
      }, 100);
      return;
    }

    const containerH = containerHeightRef.current || 400;
    const targetY = Math.max(0, layout.y - containerH * 0.32 + layout.height / 2);
    lyricsScrollRef.current.scrollTo({ y: targetY, animated });
  }, [activeIndex]);

  // Auto-scroll conforme avanza la reproducción de la pista
  useEffect(() => {
    if (isLyricsVisible && hasTimestamps && activeIndex >= 0 && !isUserScrollingRef.current) {
      scrollToActiveLine(activeIndex, true);
    }
  }, [activeIndex, isLyricsVisible, hasTimestamps, scrollToActiveLine]);

  // Centrar en la línea actual al abrir la hoja de letras
  useEffect(() => {
    if (isLyricsVisible && hasTimestamps && activeIndex >= 0) {
      const timer = setTimeout(() => {
        if (!isUserScrollingRef.current) {
          scrollToActiveLine(activeIndex, false);
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isLyricsVisible, hasTimestamps, activeIndex, scrollToActiveLine]);

  // Reiniciar estado de layouts al cambiar de canción
  useEffect(() => {
    lineLayoutsRef.current = {};
    isUserScrollingRef.current = false;
    setIsUserScrolled(false);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    lyricsScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTrack?.mediaId, activeTrack?.url, rawLyrics]);

  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    setIsUserScrolled(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      setIsUserScrolled(false);
      scrollToActiveLine(activeIndex, true);
    }, 4000);
  }, [activeIndex, scrollToActiveLine]);

  const handleManualSyncPress = useCallback(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    isUserScrollingRef.current = false;
    setIsUserScrolled(false);
    scrollToActiveLine(activeIndex, true);
  }, [activeIndex, scrollToActiveLine]);

  const handleLyricLinePress = useCallback(async (lineTime) => {
    if (lineTime === null || lineTime === undefined) return;
    try {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      isUserScrollingRef.current = false;
      setIsUserScrolled(false);
      await TrackPlayer.seekTo(lineTime);
    } catch (e) {
      console.error('[PlayerCard] Error al buscar tiempo de letra:', e);
    }
  }, []);

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
          <View style={styles.trackDetailsMainRow}>
            <View style={styles.trackDetailsTextCol}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentTrackTitle}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {currentTrackArtist}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleHeartPress}
              style={styles.favoriteButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                <MaterialCommunityIcons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFavorite ? '#EF4444' : '#8E8F9E'}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

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
          crossfadeSettings={crossfadeSettings}
        />

        {/* Botones de pie de página: Letras, Cola y Temporizador */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => setIsLyricsVisible(true)}
            style={[styles.footerButton, { marginRight: 8 }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="microphone-variant" size={18} color="#A78BFA" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Letras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={[styles.footerButton, { marginRight: 8 }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={20} color="#8E8F9E" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Cola</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSleepTimerVisible(true)}
            style={[styles.footerButton, isTimerActive && styles.footerButtonActive]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isTimerActive ? "bed-clock" : "timer-outline"}
              size={18}
              color={isTimerActive ? "#A78BFA" : "#8E8F9E"}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.footerButtonText, isTimerActive && styles.footerButtonTextActive]}>
              {isTimerActive ? (timeRemainingFormatted || 'Activo') : 'Apagado'}
            </Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.lyricsTitle} numberOfLines={1}>Letras</Text>
                  {hasTimestamps && (
                    <View style={styles.syncedBadge}>
                      <MaterialCommunityIcons name="lightning-bolt" size={12} color="#A78BFA" />
                      <Text style={styles.syncedBadgeText}>Sincronizadas</Text>
                    </View>
                  )}
                </View>
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
              ref={lyricsScrollRef}
              style={styles.lyricsScrollView}
              contentContainerStyle={styles.lyricsScrollContent}
              showsVerticalScrollIndicator={false}
              onLayout={(e) => {
                containerHeightRef.current = e.nativeEvent.layout.height;
              }}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={handleScrollEndDrag}
            >
              {isLoadingLyrics ? (
                <View style={styles.lyricsLoadingContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.lyricsLoadingText}>Cargando letra de la canción...</Text>
                </View>
              ) : lyricsText ? (
                hasTimestamps ? (
                  <View>
                    {parsedLines.map((line, idx) => {
                      const isActive = idx === activeIndex;
                      const isPassed = hasTimestamps && activeIndex >= 0 && idx < activeIndex;
                      return (
                        <TouchableOpacity
                          key={idx}
                          onLayout={(e) => {
                            lineLayoutsRef.current[idx] = e.nativeEvent.layout;
                          }}
                          onPress={() => handleLyricLinePress(line.time)}
                          disabled={line.time === null}
                          activeOpacity={0.7}
                          style={[
                            styles.lyricLineRow,
                            isActive && styles.lyricLineRowActive,
                            line.isBreak && styles.lyricLineRowBreak,
                          ]}
                        >
                          <Text
                            style={[
                              styles.lyricLineText,
                              isPassed && styles.lyricLinePassedText,
                              isActive && styles.lyricLineActiveText,
                              line.isBreak && styles.lyricLineBreakText,
                            ]}
                          >
                            {line.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.lyricsBodyText}>
                    {lyricsText}
                  </Text>
                )
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

            {/* Botón flotante para sincronizar si el usuario scrolleó manualmente */}
            {isUserScrolled && hasTimestamps && activeIndex >= 0 && (
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleManualSyncPress}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.syncButtonText}>Sincronizar</Text>
              </TouchableOpacity>
            )}
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

      <SleepTimerModal
        visible={isSleepTimerVisible}
        onClose={() => setIsSleepTimerVisible(false)}
        isTimerActive={isTimerActive}
        timerMode={timerMode}
        timeRemainingFormatted={timeRemainingFormatted}
        onSelectTimer={onSelectTimer}
        onCancelTimer={onCancelTimer}
      />

      {/* HOJA MODULAR DE COLA DE REPRODUCCIÓN */}
      <QueueSheet
        visible={isQueueVisible}
        onClose={handleCloseQueue}
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        playQueue={playQueue}
        onSelectTrack={selectTrackFromQueue}
        onRemoveFromQueue={onRemoveFromQueue}
        onMoveQueueItem={onMoveQueueItem}
        onClearUpcomingQueue={onClearUpcomingQueue}
        onTogglePlayback={handleTogglePlaybackFromQueue}
        onDragActive={onDragActive}
      />
    </Animated.View>
  );
}

