import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

/**
 * Sección de detalles de la canción (título, artista) y botón animado de Favoritos.
 *
 * @param {Object} props
 * @param {string} props.title - Título de la pista activa.
 * @param {string} props.artist - Artista de la pista activa.
 * @param {boolean} props.isFavorite - Indica si la canción está en la lista de favoritos.
 * @param {() => void} props.onToggleFavorite - Callback para alternar el estado de favorito.
 */
export default function PlayerTrackDetails({
  title,
  artist,
  isFavorite = false,
  onToggleFavorite,
}) {
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <View style={styles.trackDetailsMainRow}>
      <View style={styles.trackDetailsTextCol}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {artist}
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
  );
}
