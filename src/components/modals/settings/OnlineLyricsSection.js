import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../../styles/SettingsModal.styles';

const THRESHOLDS = [
  { label: '70%', value: 0.7 },
  { label: '75%', value: 0.75 },
  { label: '80%', value: 0.8 },
  { label: '90%', value: 0.9 },
];

/**
 * Sección de configuración para la búsqueda y coincidencia de letras en línea.
 */
export default function OnlineLyricsSection({
  enabled,
  onToggleEnabled,
  matchThreshold,
  onChangeThreshold,
}) {
  return (
    <>
      <View style={styles.settingSection}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Buscar letras en línea</Text>
            <Text style={styles.settingDescription}>
              Consulta automáticamente en LRCLIB API si la canción no incluye letra local.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggleEnabled}
            trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
            thumbColor={enabled ? '#8B5CF6' : '#64748B'}
          />
        </View>

        {enabled && (
          <View style={styles.apiInfoBox}>
            <MaterialCommunityIcons name="cloud-search-outline" size={16} color="#A78BFA" />
            <Text style={styles.apiInfoText}>
              Usa la API pública LRCLIB (gratuita, sin API key).
            </Text>
          </View>
        )}
      </View>

      {/* Umbral de coincidencia */}
      {enabled && (
        <View style={styles.settingSection}>
          <Text style={styles.subSectionTitle}>Coincidencia Mínima (% Match)</Text>
          <Text style={styles.settingDescription}>
            Evita asociar letras incorrectas requiriendo un porcentaje de similitud mínimo entre los títulos.
          </Text>
          <View style={styles.pillContainer}>
            {THRESHOLDS.map((t) => {
              const isActive = matchThreshold === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => onChangeThreshold(t.value)}
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
    </>
  );
}
