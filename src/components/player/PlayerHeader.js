import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

/**
 * Encabezado superior de la vista expandida del reproductor (PlayerCard).
 *
 * @param {Object} props
 * @param {() => void} props.onClose - Callback disparado al presionar el botón de minimizar/cerrar.
 * @param {string} [props.title="SONANDO AHORA"] - Etiqueta superior del encabezado.
 */
export default function PlayerHeader({ onClose, title = 'SONANDO AHORA' }) {
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
