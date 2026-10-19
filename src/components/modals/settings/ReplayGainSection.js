import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../../styles/SettingsModal.styles';
import { DEFAULT_REPLAYGAIN_SETTINGS } from '../../../utils/replayGain';

const RG_MODES = [
  { label: 'Por Pista', value: 'track' },
  { label: 'Por Álbum', value: 'album' },
];

const PREAMP_OPTIONS = [
  { label: '-6 dB', value: -6 },
  { label: '-3 dB', value: -3 },
  { label: '0 dB', value: 0 },
  { label: '+3 dB', value: 3 },
  { label: '+6 dB', value: 6 },
];

const FALLBACK_PREAMP_OPTIONS = [
  { label: '-9 dB', value: -9 },
  { label: '-6 dB', value: -6 },
  { label: '-3 dB', value: -3 },
  { label: '0 dB', value: 0 },
];

/**
 * Sección de configuración para Normalización de Volumen (ReplayGain y Apple Sound Check).
 */
export default function ReplayGainSection({ settings = DEFAULT_REPLAYGAIN_SETTINGS, onUpdate }) {
  const rg = settings || DEFAULT_REPLAYGAIN_SETTINGS;

  return (
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
            if (onUpdate) {
              onUpdate({ ...rg, enabled: val });
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
            {RG_MODES.map((m) => {
              const isActive = (rg.mode || 'track') === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => {
                    if (onUpdate) {
                      onUpdate({ ...rg, mode: m.value });
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
              {PREAMP_OPTIONS.map((opt) => {
                const isActive = (rg.preampWithRG ?? 0) === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                    onPress={() => {
                      if (onUpdate) {
                        onUpdate({ ...rg, preampWithRG: opt.value });
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

          {/* Pre-amplificación sin ReplayGain (Respaldo) */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subSectionTitle}>Canciones sin ReplayGain (Atenuación)</Text>
            <Text style={styles.settingDescription}>
              Ganancia aplicada a pistas sin metadatos de volumen para igualar su sonoridad.
            </Text>
            <View style={styles.pillContainer}>
              {FALLBACK_PREAMP_OPTIONS.map((opt) => {
                const isActive = (rg.preampWithoutRG ?? -6) === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, isActive && styles.pillActive, { minWidth: 46 }]}
                    onPress={() => {
                      if (onUpdate) {
                        onUpdate({ ...rg, preampWithoutRG: opt.value });
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
                if (onUpdate) {
                  onUpdate({ ...rg, preventClipping: val });
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
  );
}
