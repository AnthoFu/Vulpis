import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/web.styles';
import { WebTrack, WebRepeatMode } from '../types';

const DEFAULT_COVER = require('../../../assets/default-cover.jpg');

const formatTime = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export interface WebPlayerBottomBarProps {
  currentTrack: WebTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;
  isShuffle?: boolean;
  repeatMode?: WebRepeatMode;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
  onToggleEqualizer?: () => void;
  isEqualizerOpen?: boolean;
  isEqualizerEnabled?: boolean;
}

export default function WebPlayerBottomBar({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime = 0,
  duration = 0,
  volume = 1,
  isMuted = false,
  isShuffle = false,
  repeatMode = 'off',
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLyrics,
  isLyricsOpen,
  onToggleEqualizer,
  isEqualizerOpen = false,
  isEqualizerEnabled = false,
}: WebPlayerBottomBarProps): React.JSX.Element {
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volumePercent = isMuted ? 0 : Math.round(volume * 100);

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = Math.max(0, Math.min(1, clickX / width));
    onSeek(ratio * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSetVolume) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVol = Math.max(0, Math.min(1, clickX / width));
    onSetVolume(newVol);
  };

  return (
    <View style={styles.playerBottomBar}>
      {/* 1. Información de la Pista Activa */}
      <View style={styles.playerTrackInfo}>
        <Image
          source={currentTrack?.artwork ? { uri: currentTrack.artwork } : DEFAULT_COVER}
          style={styles.playerArtwork}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.playerTrackTitle} numberOfLines={1}>
            {currentTrack?.title || 'Sin reproducción'}
          </Text>
          <Text style={styles.playerTrackArtist} numberOfLines={1}>
            {currentTrack?.artist || 'Selecciona una canción'}
          </Text>
        </View>
      </View>

      {/* 2. Controles Centrales y Barra de Progreso */}
      <View style={styles.playerCenterControls}>
        <View style={styles.controlButtonsRow}>
          {/* Shuffle */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onToggleShuffle}
          >
            <Feather
              name="shuffle"
              size={16}
              color={isShuffle ? '#A78BFA' : '#6F738E'}
            />
          </TouchableOpacity>

          {/* Anterior */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onPrevious}
          >
            <Ionicons name="play-skip-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Play / Pausa */}
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={onTogglePlay}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            )}
          </TouchableOpacity>

          {/* Siguiente */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onNext}
          >
            <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Repetir */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onToggleRepeat}
          >
            <MaterialCommunityIcons
              name={
                repeatMode === 'track'
                  ? 'repeat-once'
                  : repeatMode === 'queue'
                  ? 'repeat'
                  : 'repeat-off'
              }
              size={18}
              color={repeatMode !== 'off' ? '#A78BFA' : '#6F738E'}
            />
          </TouchableOpacity>
        </View>

        {/* Barra de Progreso (Scrubber) */}
        <View style={styles.scrubberRow}>
          <Text style={styles.scrubberTimeText}>{formatTime(currentTime)}</Text>
          <div
            ref={scrubberRef}
            onClick={handleScrubberClick}
            style={{
              flex: 1,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <View style={styles.scrubberTrack}>
              <View
                style={[
                  styles.scrubberProgress,
                  { width: `${progressPercent}%` },
                ]}
              />
              <View
                style={[
                  styles.scrubberThumb,
                  { left: `${progressPercent}%` },
                ]}
              />
            </View>
          </div>
          <Text style={styles.scrubberTimeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* 3. Controles Laterales Derechos (Volumen y Letras) */}
      <View style={styles.playerRightControls}>
        {/* Botón de Ecualizador */}
        {onToggleEqualizer && (
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={onToggleEqualizer}
          >
            <MaterialCommunityIcons
              name="tune-vertical"
              size={20}
              color={isEqualizerOpen || isEqualizerEnabled ? '#A78BFA' : '#8E8F9E'}
            />
          </TouchableOpacity>
        )}

        {/* Botón de Letras */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={onToggleLyrics}
        >
          <MaterialCommunityIcons
            name="card-text-outline"
            size={20}
            color={isLyricsOpen ? '#A78BFA' : '#8E8F9E'}
          />
        </TouchableOpacity>

        {/* Control de Volumen */}
        <View style={styles.volumeControl}>
          <TouchableOpacity onPress={onToggleMute}>
            <Feather
              name={
                isMuted || volume === 0
                  ? 'volume-x'
                  : volume < 0.5
                  ? 'volume-1'
                  : 'volume-2'
              }
              size={18}
              color="#8E8F9E"
            />
          </TouchableOpacity>
          <div
            ref={volumeRef}
            onClick={handleVolumeClick}
            style={{
              width: 90,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <View style={styles.volumeSliderTrack}>
              <View
                style={[
                  styles.volumeSliderFill,
                  { width: `${volumePercent}%` },
                ]}
              />
            </View>
          </div>
        </View>
      </View>
    </View>
  );
}
