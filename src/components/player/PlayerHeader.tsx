import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

export interface PlayerHeaderProps {
  onClose: () => void;
  title?: string;
}

/**
 * Encabezado superior de la vista expandida del reproductor (PlayerCard).
 */
export default function PlayerHeader({
  onClose,
  title = 'SONANDO AHORA',
}: PlayerHeaderProps): React.JSX.Element {
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );
}
