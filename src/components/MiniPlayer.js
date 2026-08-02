import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import styles from '../styles/MiniPlayer.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useMiniPlayer from '../hooks/useMiniPlayer';

export default function MiniPlayer({
  activeTrack,
  isPlaying,
  position,
  duration,
  onPress,
  onQueuePress,
  tracks = [],
  playQueue = [],
  onSelectTrack,
  isShuffleActive,
}) {
  const insets = useSafeAreaInsets();
  
  const {
    isProcessing,
    togglePlayback,
    playPrevious,
    playNext,
    progressPercent,
    currentArtwork,
  } = useMiniPlayer({
    activeTrack,
    isPlaying,
    position,
    duration,
    tracks,
    playQueue,
    onSelectTrack,
    isShuffleActive,
  });

  if (!activeTrack) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        { bottom: insets.bottom + 8 }
      ]}
    >
      {/* Indicador de progreso superior elegante */}
      <View style={styles.progressBackground}>
        <View style={[styles.progressActive, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        {/* Portada de la pista */}
        <Image source={{ uri: currentArtwork }} style={styles.artwork} />

        {/* Detalles de la pista */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {activeTrack.title || 'Sin Título'}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {activeTrack.artist || 'Artista Desconocido'}
          </Text>
        </View>

        {/* Botones de control */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={playPrevious}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="skip-previous" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayback}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playNext}
            disabled={isProcessing}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="skip-next" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onQueuePress}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={24} color="#8E8F9E" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
