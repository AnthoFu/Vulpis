import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/SleepTimerModal.styles';
import { SLEEP_TIMER_MODES } from '../hooks/useSleepTimer';

export default function SleepTimerModal({
  visible,
  onClose,
  isTimerActive,
  timerMode,
  timeRemainingFormatted,
  onSelectTimer,
  onCancelTimer,
}) {
  if (!visible) return null;

  const timerOptions = [
    {
      id: SLEEP_TIMER_MODES.MINUTES_15,
      title: '15 minutos',
      description: 'Detiene la reproducción en 15 min',
      icon: 'clock-time-three-outline',
    },
    {
      id: SLEEP_TIMER_MODES.MINUTES_30,
      title: '30 minutos',
      description: 'Detiene la reproducción en 30 min',
      icon: 'clock-time-six-outline',
    },
    {
      id: SLEEP_TIMER_MODES.MINUTES_60,
      title: '60 minutos (1 hora)',
      description: 'Detiene la reproducción en 1 hora',
      icon: 'clock-time-twelve-outline',
    },
    {
      id: SLEEP_TIMER_MODES.END_OF_TRACK,
      title: 'Al finalizar la pista actual',
      description: 'Detiene la reproducción cuando termine esta canción',
      icon: 'music-note-off-outline',
    },
  ];

  const handleSelectOption = (optionId) => {
    if (onSelectTimer) {
      onSelectTimer(optionId);
    }
    onClose();
  };

  const handleCancelTimer = () => {
    if (onCancelTimer) {
      onCancelTimer();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Encabezado */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.headerIconCircle}>
                    <MaterialCommunityIcons name="bed-clock" size={22} color="#8B5CF6" />
                  </View>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.title}>Temporizador de Apagado</Text>
                    <Text style={styles.subtitle}>Detener la reproducción automáticamente</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Banner de temporizador activo */}
              {isTimerActive && (
                <View style={styles.activeBanner}>
                  <View style={styles.activeBannerLeft}>
                    <MaterialCommunityIcons name="timer-sand" size={22} color="#A78BFA" />
                    <View>
                      <Text style={styles.activeBannerTitle}>Temporizador en curso</Text>
                      <Text style={styles.activeBannerSubtitle}>
                        {timerMode === SLEEP_TIMER_MODES.END_OF_TRACK
                          ? 'Se detendrá al finalizar la pista'
                          : `Tiempo restante: ${timeRemainingFormatted || '...'}`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelTimerButton}
                    onPress={handleCancelTimer}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="timer-off-outline" size={16} color="#F87171" />
                    <Text style={styles.cancelTimerText}>Desactivar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista de opciones de temporizador */}
              <View style={styles.optionsList}>
                {timerOptions.map((opt) => {
                  const isSelected = isTimerActive && timerMode === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => handleSelectOption(opt.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.optionLeft}>
                        <View style={[styles.optionIconBox, isSelected && styles.optionIconBoxSelected]}>
                          <MaterialCommunityIcons
                            name={opt.icon}
                            size={20}
                            color={isSelected ? '#A78BFA' : '#8E8F9E'}
                          />
                        </View>
                        <View style={styles.optionTextCol}>
                          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                            {opt.title}
                          </Text>
                          <Text style={styles.optionDescription}>{opt.description}</Text>
                        </View>
                      </View>

                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Pie de modal */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
