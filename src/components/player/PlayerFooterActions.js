import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/PlayerCard.styles';

/**
 * Fila inferior de botones de acceso rápido: Letras, Cola y Temporizador de apagado.
 *
 * @param {Object} props
 * @param {() => void} props.onOpenLyrics - Disparador para abrir LyricsSheet.
 * @param {() => void} props.onOpenQueue - Disparador para abrir QueueSheet.
 * @param {() => void} props.onOpenSleepTimer - Disparador para abrir el modal del temporizador.
 * @param {boolean} props.isTimerActive - Indica si hay un temporizador de apagado en curso.
 * @param {string|null} [props.timeRemainingFormatted] - Tiempo restante formateado en texto (ej. "14m 20s").
 */
export default function PlayerFooterActions({
  onOpenLyrics,
  onOpenQueue,
  onOpenSleepTimer,
  isTimerActive = false,
  timeRemainingFormatted = null,
}) {
  return (
    <View style={styles.footerRow}>
      <TouchableOpacity
        onPress={onOpenLyrics}
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
        onPress={onOpenQueue}
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
        onPress={onOpenSleepTimer}
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
  );
}
