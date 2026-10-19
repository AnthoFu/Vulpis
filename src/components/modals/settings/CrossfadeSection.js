import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import styles from '../../../styles/SettingsModal.styles';

const CROSSFADE_DURATIONS = [2, 4, 6, 8, 10, 12];

/**
 * Sección de configuración para Fundido Cruzado (Crossfade).
 */
export default function CrossfadeSection({
  settings = { enabled: false, duration: 4 },
  onUpdate,
}) {
  return (
    <View style={styles.settingSection}>
      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingLabel}>Fundido Cruzado (Crossfade)</Text>
          <Text style={styles.settingDescription}>
            Transición suave de volumen entre canciones para evitar pausas o cortes bruscos al cambiar de pista.
          </Text>
        </View>
        <Switch
          value={settings?.enabled ?? false}
          onValueChange={(val) => {
            if (onUpdate) {
              onUpdate({ ...settings, enabled: val });
            }
          }}
          trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
          thumbColor={settings?.enabled ? '#8B5CF6' : '#64748B'}
        />
      </View>

      {settings?.enabled && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subSectionTitle}>Duración del fundido</Text>
          <View style={styles.pillContainer}>
            {CROSSFADE_DURATIONS.map((sec) => {
              const isActive = (settings?.duration ?? 4) === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                  onPress={() => {
                    if (onUpdate) {
                      onUpdate({ ...settings, duration: sec });
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
  );
}
