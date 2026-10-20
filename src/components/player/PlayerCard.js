import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import styles from '../../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import QueueSheet from './QueueSheet';
import LyricsSheet from './LyricsSheet';
import usePlayerCard from '../../hooks/usePlayerCard';
import useSyncedLyrics from '../../hooks/useSyncedLyrics';
import { SPRING, DURATION } from '../../constants/animations';
import EditLyricsModal from '../modals/EditLyricsModal';
import SleepTimerModal from '../modals/SleepTimerModal';

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

  // Hook modular para sincronización, auto-scroll y salto en letras (.lrc)
  const {
    parsedLines,
    hasTimestamps,
    activeIndex,
    activeLyricLine,
    isUserScrolled,
    lyricsScrollRef,
    lineLayoutsRef,
    containerHeightRef,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleManualSyncPress,
    handleLyricLinePress,
  } = useSyncedLyrics({
    rawLyrics,
    lyricsText,
    position,
    activeTrackId: activeTrack?.mediaId,
    isVisible: isLyricsVisible,
  });

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

  const renderBackground = () => (
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

          {/* Banner con animación de fade para previsualización de la línea activa de la letra */}
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
                <MaterialCommunityIcons
                  name="microphone-variant"
                  size={14}
                  color="rgba(167, 139, 250, 0.7)"
                  style={{ marginRight: 6 }}
                />
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
            <MaterialCommunityIcons
              name="microphone-variant"
              size={18}
              color="#A78BFA"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.footerButtonText}>Letras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={[styles.footerButton, { marginRight: 8 }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="playlist-play"
              size={20}
              color="#8E8F9E"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.footerButtonText}>Cola</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSleepTimerVisible(true)}
            style={[styles.footerButton, isTimerActive && styles.footerButtonActive]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isTimerActive ? 'bed-clock' : 'timer-outline'}
              size={18}
              color={isTimerActive ? '#A78BFA' : '#8E8F9E'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.footerButtonText, isTimerActive && styles.footerButtonTextActive]}>
              {isTimerActive ? timeRemainingFormatted || 'Activo' : 'Apagado'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HOJA MODAL INFERIOR DE LETRAS */}
      <LyricsSheet
        visible={isLyricsVisible}
        onClose={() => setIsLyricsVisible(false)}
        insets={insets}
        currentTrackTitle={currentTrackTitle}
        currentTrackArtist={currentTrackArtist}
        lyricsText={lyricsText}
        isLoadingLyrics={isLoadingLyrics}
        parsedLines={parsedLines}
        hasTimestamps={hasTimestamps}
        activeIndex={activeIndex}
        isUserScrolled={isUserScrolled}
        lyricsScrollRef={lyricsScrollRef}
        lineLayoutsRef={lineLayoutsRef}
        containerHeightRef={containerHeightRef}
        handleScrollBeginDrag={handleScrollBeginDrag}
        handleScrollEndDrag={handleScrollEndDrag}
        handleManualSyncPress={handleManualSyncPress}
        handleLyricLinePress={handleLyricLinePress}
        onOpenEditLyrics={() => setIsEditLyricsVisible(true)}
      />

      {/* MODAL DE EDICIÓN DE LETRAS */}
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

      {/* MODAL DE TEMPORIZADOR DE APAGADO */}
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
