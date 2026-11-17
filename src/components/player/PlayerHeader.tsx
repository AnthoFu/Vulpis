import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

export interface PlayerHeaderProps {
  onClose: () => void;
  title?: string;
  onSwipeDown?: (dy: number) => void;
  onSwipeDownRelease?: (dy: number, vy: number) => void;
}

/**
 * Encabezado superior de la vista expandida del reproductor (PlayerCard).
 * Soporta arrastre táctil hacia abajo para minimizar la tarjeta.
 */
export default function PlayerHeader({
  onClose,
  title = 'SONANDO AHORA',
  onSwipeDown,
  onSwipeDownRelease,
}: PlayerHeaderProps): React.JSX.Element {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 8 && gestureState.dy > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          onSwipeDown?.(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        onSwipeDownRelease?.(gestureState.dy, gestureState.vy);
      },
      onPanResponderTerminate: () => {
        onSwipeDownRelease?.(0, 0);
      },
    })
  ).current;

  return (
    <View style={styles.headerRow} {...panResponder.panHandlers}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );
}
