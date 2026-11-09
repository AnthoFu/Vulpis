import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../../styles/SettingsModal.styles';
import {
  EqualizerSettings,
  EQUALIZER_PRESETS,
  DEFAULT_EQUALIZER_SETTINGS,
} from '../../../models/EqualizerSettings';

export interface EqualizerSectionProps {
  settings?: EqualizerSettings;
  onToggle?: (enabled: boolean) => void;
  onOpenModal?: () => void;
}

/**
 * Sección modular del Ecualizador de Audio dentro del modal de Ajustes.
 */
export default function EqualizerSection({
  settings = DEFAULT_EQUALIZER_SETTINGS,
  onToggle,
  onOpenModal,
}: EqualizerSectionProps): React.JSX.Element {
  const isEnabled = settings?.enabled ?? false;
  const preset = EQUALIZER_PRESETS[settings?.presetId] || EQUALIZER_PRESETS.flat;

  return (
    <View style={styles.settingSection}>
      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingLabel}>Ecualizador de Audio</Text>
          <Text style={styles.settingDescription}>
            {isEnabled
              ? `Perfil activo: ${preset.name}${settings.bassBoost > 0 ? ` (+${settings.bassBoost}dB graves)` : ''}`
              : 'Ajusta frecuencias acústicas de 5 bandas, presets y refuerzo de graves.'}
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(val: boolean) => onToggle?.(val)}
          trackColor={{ false: '#1E202E', true: 'rgba(139, 92, 246, 0.4)' }}
          thumbColor={isEnabled ? '#8B5CF6' : '#64748B'}
        />
      </View>

      <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={[styles.actionTimerBtn, isEnabled && styles.actionTimerBtnActive]}
          onPress={onOpenModal}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="tune-vertical"
            size={18}
            color={isEnabled ? '#A78BFA' : '#8B5CF6'}
          />
          <Text
            style={[
              styles.actionTimerBtnText,
              isEnabled && styles.actionTimerBtnTextActive,
            ]}
          >
            {isEnabled ? 'Personalizar Bandas' : 'Abrir Ecualizador'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
