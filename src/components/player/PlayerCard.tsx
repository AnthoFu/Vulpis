import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import styles from '../../styles/PlayerCard.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RepeatMode } from '@rntp/player';

// Subcomponentes modulares de PlayerCard
import PlayerHeader from './PlayerHeader';
import PlayerArtwork from './PlayerArtwork';
import PlayerTrackDetails from './PlayerTrackDetails';
import PlayerLiveLyric from './PlayerLiveLyric';
import PlayerFooterActions from './PlayerFooterActions';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import QueueSheet from './QueueSheet';
import LyricsSheet from './LyricsSheet';

// Modales complementarios
import EditLyricsModal from '../modals/EditLyricsModal';
import SleepTimerModal from '../modals/SleepTimerModal';

// Hooks y animaciones
import usePlayerCard from '../../hooks/usePlayerCard';
import useSyncedLyrics from '../../hooks/useSyncedLyrics';
import { SPRING, DURATION } from '../../constants/animations';
import { PlayerContext } from '../../context/PlayerContext';
import { Track } from '../../models/Track';
import { CrossfadeSettings } from '../../models/AudioSettings';
import { SleepTimerMode } from '../../hooks/useSleepTimer';

export interface PlayerCardProps {
  activeTrack?: Track | null;
  isPlaying?: boolean;
  position?: number;
  duration?: number;
  repeatMode?: RepeatMode;
  isShuffleActive?: boolean;
  tracks?: Track[];
  playQueue?: Track[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onRemoveFromQueue?: (track: Track, index: number) => void;
  onMoveQueueItem?: (from: number, to: number) => void;
  onClearUpcomingQueue?: () => void;
  onReorderQueueState?: (queue: Track[]) => void;
  onSyncReorderNative?: (queue: Track[], activeId: string) => void;
  onDragActive?: (active: boolean) => void;
  onClose?: () => void;
  onSelectTrack?: (track: Track, index: number) => Promise<void> | void;
  initialQueueVisible?: boolean;
  isTimerActive?: boolean;
  timerMode?: SleepTimerMode | null;
  timeRemainingFormatted?: string | null;
  onSelectTimer?: (mode: SleepTimerMode) => void;
  onCancelTimer?: () => void;
  crossfadeSettings?: CrossfadeSettings;
}

/**
 * Vista a pantalla completa del reproductor activo (PlayerCard).
 * Orquesta la presentación visual modular, animaciones de transición y hojas modales.
 * Puede consumir directamente el `PlayerContext` o recibir propiedades explícitas.
 */
export default function PlayerCard(props: PlayerCardProps): React.JSX.Element {
  const player = React.useContext(PlayerContext);

  const activeTrack = props.activeTrack !== undefined ? props.activeTrack : player?.activeTrack;
  const isPlaying = props.isPlaying !== undefined ? props.isPlaying : (player?.isPlaying || false);
  const position = props.position !== undefined ? props.position : (player?.progress?.position || 0);
  const duration = props.duration !== undefined ? props.duration : (player?.progress?.duration || 0);
  const repeatMode = props.repeatMode !== undefined ? props.repeatMode : (player?.repeatMode || RepeatMode.Off);
  const isShuffleActive = props.isShuffleActive !== undefined ? props.isShuffleActive : (player?.isShuffleActive || false);
  const tracks = props.tracks || player?.tracks || [];
  const playQueue = props.playQueue || player?.playQueue || [];
  const isFavorite = props.isFavorite !== undefined 
    ? props.isFavorite 
    : (activeTrack && player?.isFavoriteTrack ? player.isFavoriteTrack(activeTrack.mediaId) : false);
  const onToggleFavorite = props.onToggleFavorite || (() => {
    if (activeTrack && player?.handleToggleFavorite) {
      player.handleToggleFavorite(activeTrack);
    }
  });
  const onRemoveFromQueue = props.onRemoveFromQueue || player?.handleRemoveFromQueue;
  const onMoveQueueItem = props.onMoveQueueItem || player?.handleMoveQueueItem;
  const onClearUpcomingQueue = props.onClearUpcomingQueue || player?.handleClearUpcomingQueue;
  const onDragActive = props.onDragActive || player?.handleSetDragActive;
  const onClose = props.onClose || (() => player?.setIsFullPlayerVisible?.(false));
  const onSelectTrack = props.onSelectTrack || player?.handleSelectTrack;
  const initialQueueVisible = props.initialQueueVisible !== undefined ? props.initialQueueVisible : (player?.startWithQueueVisible || false);
  const isTimerActive = props.isTimerActive !== undefined ? props.isTimerActive : (player?.isTimerActive || false);
  const timerMode = props.timerMode !== undefined ? props.timerMode : (player?.timerMode ?? null);
  const timeRemainingFormatted = props.timeRemainingFormatted !== undefined ? props.timeRemainingFormatted : (player?.timeRemainingFormatted ?? null);
  const onSelectTimer = props.onSelectTimer || player?.startSleepTimer;
  const onCancelTimer = props.onCancelTimer || player?.cancelSleepTimer;
  const crossfadeSettings = props.crossfadeSettings || player?.crossfadeSettings;

  const insets = useSafeAreaInsets();
  const [isEditLyricsVisible, setIsEditLyricsVisible] = useState<boolean>(false);
  const [isSleepTimerVisible, setIsSleepTimerVisible] = useState<boolean>(false);

  // Hook controlador de PlayerCard (colores dinámicos, letras y cola)
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

  // Animación de deslizamiento de entrada de la tarjeta completa
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const playerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(playerSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      ...SPRING.gentle,
    }).start();
  }, [playerSlideAnim]);

  const handleClose = useCallback(() => {
    Animated.timing(playerSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: DURATION.fast,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [playerSlideAnim, SCREEN_HEIGHT, onClose]);

  const handleCloseQueue = useCallback(() => {
    setIsQueueVisible(false);
  }, [setIsQueueVisible]);

  const handleTogglePlaybackFromQueue = useCallback(() => {
    togglePlayback(isPlaying);
  }, [togglePlayback, isPlaying]);

  const renderBackground = (): React.JSX.Element => (
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

      {/* 1. Encabezado superior */}
      <PlayerHeader onClose={handleClose} />

      {/* 2. Portada con marco de sombra */}
      <PlayerArtwork artworkUrl={currentTrackArtwork} />

      {/* 3. Sección inferior: Detalles, progreso, controles y acciones */}
      <View style={styles.bottomSection}>
        <View style={styles.trackDetails}>
          <PlayerTrackDetails
            title={currentTrackTitle}
            artist={currentTrackArtist}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
          <PlayerLiveLyric
            activeLyricLine={activeLyricLine}
            onPress={() => setIsLyricsVisible(true)}
          />
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

        <PlayerFooterActions
          onOpenLyrics={() => setIsLyricsVisible(true)}
          onOpenQueue={() => setIsQueueVisible(true)}
          onOpenSleepTimer={() => setIsSleepTimerVisible(true)}
          isTimerActive={isTimerActive}
          timeRemainingFormatted={timeRemainingFormatted}
        />
      </View>

      {/* 4. Hoja modal de letras */}
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

      {/* 5. Modal de edición de letras */}
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

      {/* 6. Modal de temporizador de apagado */}
      <SleepTimerModal
        visible={isSleepTimerVisible}
        onClose={() => setIsSleepTimerVisible(false)}
        isTimerActive={isTimerActive}
        timerMode={timerMode}
        timeRemainingFormatted={timeRemainingFormatted}
        onSelectTimer={onSelectTimer}
        onCancelTimer={onCancelTimer}
      />

      {/* 7. Hoja modular de cola de reproducción */}
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
