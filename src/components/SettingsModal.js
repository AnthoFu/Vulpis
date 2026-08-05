import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/SettingsModal.styles';
import { getSettings, saveSettings, clearLyricsCache } from '../utils/onlineLyrics';

export default function SettingsModal({ visible, onClose, onShowToast }) {
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

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
