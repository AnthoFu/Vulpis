import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/SettingsModal.styles';
import { getSettings, saveSettings, clearLyricsCache } from '../../services/lyrics/lyricsService';
import { DEFAULT_REPLAYGAIN_SETTINGS } from '../../utils/replayGain';
import SleepTimerModal from './SleepTimerModal';
import OnlineLyricsSection from './settings/OnlineLyricsSection';
import ReplayGainSection from './settings/ReplayGainSection';
import CrossfadeSection from './settings/CrossfadeSection';

export default function SettingsModal({
  visible,
  onClose,
  onShowToast,
  isTimerActive = false,
  timerMode = null,
  timeRemainingFormatted = null,
  onSelectTimer,
  onCancelTimer,
  crossfadeSettings = { enabled: false, duration: 4 },
  onUpdateCrossfade,
  replayGainSettings = DEFAULT_REPLAYGAIN_SETTINGS,
  onUpdateReplayGain,
}) {
  const [isSleepTimerVisible, setIsSleepTimerVisible] = useState(false);
  const [settings, setSettingsState] = useState({
    onlineLyricsEnabled: false,
    matchThreshold: 0.75,
  });

  useEffect(() => {
    if (visible) {
      getSettings().then(setSettingsState);
    }
  }, [visible]);

  const toggleOnlineLyrics = async (val) => {
    const updated = { ...settings, onlineLyricsEnabled: val };
    setSettingsState(updated);
    await saveSettings(updated);
    if (onShowToast) {
      onShowToast(
        val
          ? 'Búsqueda de letras en línea activada'
          : 'Búsqueda de letras en línea desactivada'
      );
    }
  };

  const setThreshold = async (val) => {
    const updated = { ...settings, matchThreshold: val };
    setSettingsState(updated);
    await saveSettings(updated);
    if (onShowToast) {
      onShowToast(`Umbral de coincidencia: ${Math.round(val * 100)}%`);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché de Letras',
      '¿Deseas eliminar las letras guardadas localmente? Se volverán a consultar según sea necesario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearLyricsCache();
            if (onShowToast) {
              onShowToast('Caché de letras limpiado');
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

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
                  <MaterialCommunityIcons name="cog" size={22} color="#8B5CF6" />
                  <Text style={styles.title}>Ajustes de Vulpis</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Sección modular: Letras en línea */}
                <OnlineLyricsSection
                  enabled={settings.onlineLyricsEnabled}
                  onToggleEnabled={toggleOnlineLyrics}
                  matchThreshold={settings.matchThreshold}
                  onChangeThreshold={setThreshold}
                />

                {/* Sección modular: ReplayGain */}
                <ReplayGainSection
                  settings={replayGainSettings}
                  onUpdate={onUpdateReplayGain}
                />

                {/* Sección modular: Crossfade */}
                <CrossfadeSection
                  settings={crossfadeSettings}
                  onUpdate={onUpdateCrossfade}
                />

                {/* Temporizador de apagado */}
                <View style={styles.settingSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextCol}>
                      <Text style={styles.settingLabel}>Temporizador de apagado</Text>
                      <Text style={styles.settingDescription}>
                        {isTimerActive
                          ? `Activo (${timeRemainingFormatted || 'En curso'})`
                          : 'Detén la reproducción automáticamente después de un tiempo'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionTimerBtn, isTimerActive && styles.actionTimerBtnActive]}
                      onPress={() => setIsSleepTimerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isTimerActive ? 'bed-clock' : 'timer-outline'}
                        size={18}
                        color={isTimerActive ? '#A78BFA' : '#8B5CF6'}
                      />
                      <Text
                        style={[
                          styles.actionTimerBtnText,
                          isTimerActive && styles.actionTimerBtnTextActive,
                        ]}
                      >
                        {isTimerActive ? timeRemainingFormatted || 'Activo' : 'Configurar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Limpiar Caché */}
                <View style={styles.settingSection}>
                  <Text style={styles.subSectionTitle}>Almacenamiento</Text>
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={handleClearCache}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#F87171" />
                    <Text style={styles.dangerButtonText}>Limpiar caché de letras en línea</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      <SleepTimerModal
        visible={isSleepTimerVisible}
        onClose={() => setIsSleepTimerVisible(false)}
        isTimerActive={isTimerActive}
        timerMode={timerMode}
        timeRemainingFormatted={timeRemainingFormatted}
        onSelectTimer={onSelectTimer}
        onCancelTimer={onCancelTimer}
      />
    </Modal>
  );
}
