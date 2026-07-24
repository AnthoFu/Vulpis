import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer from '@rntp/player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MiniPlayer({
  activeTrack,
  isPlaying,
  position,
  duration,
  onPress,
  tracks = [],
  playQueue = [],
  onSelectTrack,
  isShuffleActive,
}) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeTrack) return null;

  const togglePlayback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.error('[MiniPlayer] Error al alternar la reproducción:', e);
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playLibraryFallback = async (direction) => {
    try {
      if (tracks && tracks.length > 0 && onSelectTrack) {
        let targetIndex = 0;
        if (isShuffleActive) {
          targetIndex = Math.floor(Math.random() * tracks.length);
        } else if (activeTrack) {
          const currentIdx = tracks.findIndex(t => t.mediaId === activeTrack.mediaId);
          if (currentIdx !== -1) {
            if (direction === 'next') {
              targetIndex = (currentIdx + 1) % tracks.length;
            } else {
              targetIndex = (currentIdx - 1 + tracks.length) % tracks.length;
            }
          }
        }
        const targetTrack = tracks[targetIndex];
        if (targetTrack) {
          console.log(`[MiniPlayer] Saltando respaldo a pista de biblioteca: ${targetTrack.title}`);
          await onSelectTrack(targetTrack, targetIndex);
        }
      } else {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      }
    } catch (fallbackErr) {
      console.error('[MiniPlayer] Error en playLibraryFallback:', fallbackErr);
      try {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
      } catch (err) {
        console.error('[MiniPlayer] Respaldo absoluto falló:', err);
      }
    }
  };

  const playPrevious = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[MiniPlayer] Saltando a la pista anterior de la cola');
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else {
        console.log('[MiniPlayer] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('prev');
      }
    } catch (e) {
      console.log('[MiniPlayer] No hay pista anterior:', e);
      await playLibraryFallback('prev');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const playNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 1500);
    try {
      if (playQueue && playQueue.length > 1) {
        console.log('[MiniPlayer] Saltando a la siguiente pista de la cola');
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else {
        console.log('[MiniPlayer] La cola tiene 1 o menos pistas, activando respaldo de biblioteca');
        await playLibraryFallback('next');
      }
    } catch (e) {
      console.log('[MiniPlayer] No hay siguiente pista:', e);
      await playLibraryFallback('next');
    } finally {
      clearTimeout(timer);
      setIsProcessing(false);
    }
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const currentArtwork = activeTrack.artworkUrl || defaultCover;

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
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: '#161722',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2D3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // Para recortar correctamente las esquinas de la barra de progreso superior
  },
  progressBackground: {
    height: 2,
    width: '100%',
    backgroundColor: '#232433',
  },
  progressActive: {
    height: 2,
    backgroundColor: '#8B5CF6',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#232433',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: '#8E8F9E',
    fontSize: 12,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
