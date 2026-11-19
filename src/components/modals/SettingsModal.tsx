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
import { getSettings, saveSettings } from '../../services/lyrics/lyricsService';
import { DEFAULT_REPLAYGAIN_SETTINGS } from '../../utils/replayGain';
import SleepTimerModal from './SleepTimerModal';
import OnlineLyricsSection from './settings/OnlineLyricsSection';
import ReplayGainSection from './settings/ReplayGainSection';
import CrossfadeSection from './settings/CrossfadeSection';
import EqualizerSection from './settings/EqualizerSection';
import StorageSection from './settings/StorageSection';
import ThemeSection from './settings/ThemeSection';
import { PlayerContext } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { CrossfadeSettings, ReplayGainSettings } from '../../models/AudioSettings';
import { EqualizerSettings } from '../../models/EqualizerSettings';
import { DEFAULT_EQUALIZER_SETTINGS } from '../../utils/equalizer';
import { SleepTimerMode } from '../../hooks/useSleepTimer';

export interface SettingsModalProps {
  visible?: boolean;
  onClose?: () => void;
  onShowToast?: (message: string) => void;
  isTimerActive?: boolean;
  timerMode?: SleepTimerMode | null;
  timeRemainingFormatted?: string | null;
  onSelectTimer?: (mode: SleepTimerMode) => void;
  onCancelTimer?: () => void;
  crossfadeSettings?: CrossfadeSettings;
  onUpdateCrossfade?: (settings: CrossfadeSettings) => void;
  replayGainSettings?: ReplayGainSettings;
  onUpdateReplayGain?: (settings: ReplayGainSettings) => void;
  equalizerSettings?: EqualizerSettings;
  onToggleEqualizer?: (enabled: boolean) => void;
  onOpenEqualizer?: () => void;
}

/**
 * Modal principal de configuración de Vulpis.
 * Permite gestionar letras en línea, normalización ReplayGain, Crossfade, temporizador y caché.
 */
export default function SettingsModal(props: SettingsModalProps): React.JSX.Element | null {
  const player = React.useContext(PlayerContext);
  const { palette } = useTheme();

  const visible = props.visible !== undefined ? props.visible : (player?.isSettingsOpen || false);
  const onClose = props.onClose || (() => player?.setIsSettingsOpen?.(false));
  const onShowToast = props.onShowToast || player?.showToast;
  const isTimerActive = props.isTimerActive !== undefined ? props.isTimerActive : (player?.isTimerActive || false);
  const timerMode = props.timerMode !== undefined ? props.timerMode : (player?.timerMode ?? null);
  const timeRemainingFormatted = props.timeRemainingFormatted !== undefined ? props.timeRemainingFormatted : (player?.timeRemainingFormatted ?? null);
  const onSelectTimer = props.onSelectTimer || player?.startSleepTimer;
  const onCancelTimer = props.onCancelTimer || player?.cancelSleepTimer;
  const crossfadeSettings = props.crossfadeSettings || player?.crossfadeSettings || { enabled: false, duration: 4 };
  const onUpdateCrossfade = props.onUpdateCrossfade || player?.handleUpdateCrossfade;
  const replayGainSettings = props.replayGainSettings || player?.replayGainSettings || DEFAULT_REPLAYGAIN_SETTINGS;
  const onUpdateReplayGain = props.onUpdateReplayGain || player?.handleUpdateReplayGain;
  const equalizerSettings = props.equalizerSettings || player?.equalizerSettings || DEFAULT_EQUALIZER_SETTINGS;
  const onToggleEqualizer = props.onToggleEqualizer || player?.handleToggleEqualizer;
  const onOpenEqualizer = props.onOpenEqualizer || (() => player?.setIsEqualizerOpen?.(true));

  const [isSleepTimerVisible, setIsSleepTimerVisible] = useState<boolean>(false);
  const [settings, setSettingsState] = useState<{
    onlineLyricsEnabled: boolean;
    matchThreshold: number;
  }>({
    onlineLyricsEnabled: false,
    matchThreshold: 0.75,
  });

  useEffect(() => {
    if (visible) {
      getSettings().then((s) => {
        setSettingsState({
          onlineLyricsEnabled: s.onlineLyricsEnabled,
          matchThreshold: s.matchThreshold,
        });
      });
    }
  }, [visible]);

  const toggleOnlineLyrics = async (val: boolean): Promise<void> => {
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

  const setThreshold = async (val: number): Promise<void> => {
    const updated = { ...settings, matchThreshold: val };
    setSettingsState(updated);
    await saveSettings(updated);
    if (onShowToast) {
      onShowToast(`Umbral de coincidencia: ${Math.round(val * 100)}%`);
    }
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
            <View style={[styles.modalContainer, { backgroundColor: palette.bgModal, borderColor: palette.borderSubtle }]}>
              {/* Encabezado */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <MaterialCommunityIcons name="cog" size={22} color={palette.accent} />
                  <Text style={styles.title}>Ajustes de Vulpis</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.borderDivider }]} />

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Sección modular: Temas Visuales */}
                <ThemeSection onShowToast={onShowToast} />

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

                {/* Sección modular: Ecualizador de Audio */}
                <EqualizerSection
                  settings={equalizerSettings}
                  onToggle={onToggleEqualizer}
                  onOpenModal={onOpenEqualizer}
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

                {/* Gestor modular de Almacenamiento y Caché */}
                <StorageSection onShowToast={onShowToast} />
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
