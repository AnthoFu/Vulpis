import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/SettingsModal.styles';
import { getSettings, saveSettings, clearLyricsCache } from '../utils/onlineLyrics';
import { DEFAULT_REPLAYGAIN_SETTINGS } from '../utils/replayGain';
import SleepTimerModal from './SleepTimerModal';

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
      onShowToast(val ? 'Búsqueda de letras en línea activada' : 'Búsqueda de letras en línea desactivada');
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

  const thresholds = [
    { label: '70%', value: 0.7 },
    { label: '75%', value: 0.75 },
    { label: '80%', value: 0.8 },
    { label: '90%', value: 0.9 },
  ];

  const rgModes = [
    { label: 'Por Pista', value: 'track' },
    { label: 'Por Álbum', value: 'album' },
  ];

  const preampOptions = [
    { label: '-6 dB', value: -6 },
    { label: '-3 dB', value: -3 },
    { label: '0 dB', value: 0 },
    { label: '+3 dB', value: 3 },
    { label: '+6 dB', value: 6 },
  ];

  const fallbackPreampOptions = [
    { label: '-9 dB', value: -9 },
    { label: '-6 dB', value: -6 },
    { label: '-3 dB', value: -3 },
    { label: '0 dB', value: 0 },
  ];

  const rg = replayGainSettings || DEFAULT_REPLAYGAIN_SETTINGS;

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
                {/* Ajuste: Búsqueda en línea */}
                <View style={styles.settingSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextCol}>
                      <Text style={styles.settingLabel}>Buscar letras en línea</Text>
                      <Text style={styles.settingDescription}>
                        Consulta automáticamente en LRCLIB API si la canción no incluye letra local.
                      </Text>
                    </View>
                    <Switch
                      value={settings.onlineLyricsEnabled}
                      onValueChange={toggleOnlineLyrics}
                      trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
                      thumbColor={settings.onlineLyricsEnabled ? '#8B5CF6' : '#64748B'}
                    />
                  </View>

                  {settings.onlineLyricsEnabled && (
                    <View style={styles.apiInfoBox}>
                      <MaterialCommunityIcons name="cloud-search-outline" size={16} color="#A78BFA" />
                      <Text style={styles.apiInfoText}>
                        Usa la API pública LRCLIB (gratuita, sin API key).
                      </Text>
                    </View>
                  )}
                </View>

                {/* Ajuste: Umbral de coincidencia */}
                {settings.onlineLyricsEnabled && (
                  <View style={styles.settingSection}>
                    <Text style={styles.subSectionTitle}>Coincidencia Mínima (% Match)</Text>
                    <Text style={styles.settingDescription}>
                      Evita asociar letras incorrectas requiriendo un porcentaje de similitud mínimo entre los títulos.
                    </Text>
                    <View style={styles.pillContainer}>
                      {thresholds.map((t) => {
                        const isActive = settings.matchThreshold === t.value;
                        return (
                          <TouchableOpacity
                            key={t.value}
                            style={[styles.pill, isActive && styles.pillActive]}
                            onPress={() => setThreshold(t.value)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Ajuste: Normalización de Volumen (ReplayGain) */}
                <View style={styles.settingSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextCol}>
                      <Text style={styles.settingLabel}>Normalización de Volumen</Text>
                      <Text style={styles.settingDescription}>
                        Mantiene un nivel de volumen homogéneo (ReplayGain y Sound Check) entre canciones de distintos álbumes o fuentes.
                      </Text>
                    </View>
                    <Switch
                      value={rg.enabled ?? false}
                      onValueChange={(val) => {
                        if (onUpdateReplayGain) {
                          onUpdateReplayGain({ ...rg, enabled: val });
                        }
                      }}
                      trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
                      thumbColor={rg.enabled ? '#8B5CF6' : '#64748B'}
                    />
                  </View>

                  {rg.enabled && (
                    <View style={{ marginTop: 12 }}>
                      {/* Modo de ganancia */}
                      <Text style={styles.subSectionTitle}>Modo de normalización</Text>
                      <View style={styles.pillContainer}>
                        {rgModes.map((m) => {
                          const isActive = (rg.mode || 'track') === m.value;
                          return (
                            <TouchableOpacity
                              key={m.value}
                              style={[styles.pill, isActive && styles.pillActive]}
                              onPress={() => {
                                if (onUpdateReplayGain) {
                                  onUpdateReplayGain({ ...rg, mode: m.value });
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                {m.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Pre-amplificación con ReplayGain */}
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.subSectionTitle}>Pre-amplificación (Con ReplayGain)</Text>
                        <Text style={styles.settingDescription}>
                          Ajuste fino de volumen sobre el estándar acústico de 89 dB SPL.
                        </Text>
                        <View style={styles.pillContainer}>
                          {preampOptions.map((opt) => {
                            const isActive = (rg.preampWithRG ?? 0) === opt.value;
                            return (
                              <TouchableOpacity
                                key={opt.value}
                                style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                                onPress={() => {
                                  if (onUpdateReplayGain) {
                                    onUpdateReplayGain({ ...rg, preampWithRG: opt.value });
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Pre-amplificación sin ReplayGain (Fallback) */}
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.subSectionTitle}>Canciones sin ReplayGain (Atenuación)</Text>
                        <Text style={styles.settingDescription}>
                          Ganancia aplicada a pistas sin metadatos de volumen para igualar su sonoridad.
                        </Text>
                        <View style={styles.pillContainer}>
                          {fallbackPreampOptions.map((opt) => {
                            const isActive = (rg.preampWithoutRG ?? -6) === opt.value;
                            return (
                              <TouchableOpacity
                                key={opt.value}
                                style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                                onPress={() => {
                                  if (onUpdateReplayGain) {
                                    onUpdateReplayGain({ ...rg, preampWithoutRG: opt.value });
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Evitar distorsión (Anti-Clipping) */}
                      <View style={[styles.settingRow, { marginTop: 14 }]}>
                        <View style={styles.settingTextCol}>
                          <Text style={styles.settingLabel}>Prevenir distorsión (Anti-Clipping)</Text>
                          <Text style={styles.settingDescription}>
                            Limita la ganancia máxima para evitar saturación digital si el pico excede el límite.
                          </Text>
                        </View>
                        <Switch
                          value={rg.preventClipping !== false}
                          onValueChange={(val) => {
                            if (onUpdateReplayGain) {
                              onUpdateReplayGain({ ...rg, preventClipping: val });
                            }
                          }}
                          trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
                          thumbColor={rg.preventClipping !== false ? '#8B5CF6' : '#64748B'}
                        />
                      </View>

                      <View style={styles.apiInfoBox}>
                        <MaterialCommunityIcons name="equalizer" size={16} color="#A78BFA" />
                        <Text style={styles.apiInfoText}>
                          Compatible con etiquetas ReplayGain (ID3v2, FLAC, Vorbis) y Apple Sound Check (iTunNORM).
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Ajuste: Fundido Cruzado (Crossfade) */}
                <View style={styles.settingSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextCol}>
                      <Text style={styles.settingLabel}>Fundido Cruzado (Crossfade)</Text>
                      <Text style={styles.settingDescription}>
                        Transición suave de volumen entre canciones para evitar pausas o cortes bruscos al cambiar de pista.
                      </Text>
                    </View>
                    <Switch
                      value={crossfadeSettings?.enabled ?? false}
                      onValueChange={(val) => {
                        if (onUpdateCrossfade) {
                          onUpdateCrossfade({ ...crossfadeSettings, enabled: val });
                        }
                      }}
                      trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
                      thumbColor={crossfadeSettings?.enabled ? '#8B5CF6' : '#64748B'}
                    />
                  </View>

                  {crossfadeSettings?.enabled && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.subSectionTitle}>Duración del fundido</Text>
                      <View style={styles.pillContainer}>
                        {[2, 4, 6, 8, 10, 12].map((sec) => {
                          const isActive = (crossfadeSettings?.duration ?? 4) === sec;
                          return (
                            <TouchableOpacity
                              key={sec}
                              style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                              onPress={() => {
                                if (onUpdateCrossfade) {
                                  onUpdateCrossfade({ ...crossfadeSettings, duration: sec });
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                {sec}s
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

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
                        name={isTimerActive ? "bed-clock" : "timer-outline"}
                        size={18}
                        color={isTimerActive ? "#A78BFA" : "#8B5CF6"}
                      />
                      <Text style={[styles.actionTimerBtnText, isTimerActive && styles.actionTimerBtnTextActive]}>
                        {isTimerActive ? (timeRemainingFormatted || 'Activo') : 'Configurar'}
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
