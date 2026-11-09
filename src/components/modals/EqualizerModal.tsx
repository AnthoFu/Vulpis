import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import styles from '../../styles/EqualizerModal.styles';
import { Colors } from '../../constants/colors';
import {
  EqualizerSettings,
  EqualizerPresetId,
  EQUALIZER_PRESETS,
  DEFAULT_EQUALIZER_SETTINGS,
} from '../../models/EqualizerSettings';

const BAND_SUB_LABELS: Record<number, string> = {
  0: 'Subgraves',
  1: 'Graves',
  2: 'Medios',
  3: 'Presencia',
  4: 'Agudos',
};

export interface EqualizerModalProps {
  visible: boolean;
  onClose: () => void;
  settings?: EqualizerSettings;
  onToggle?: (enabled: boolean) => void;
  onSelectPreset?: (presetId: EqualizerPresetId) => void;
  onUpdateBandGain?: (bandIndex: number, gain: number) => void;
  onUpdateBassBoost?: (bassBoost: number) => void;
  onReset?: () => void;
}

/**
 * Modal interactivo para el Ecualizador de Audio gráfico de 5 bandas y refuerzo de graves.
 */
export default function EqualizerModal({
  visible,
  onClose,
  settings = DEFAULT_EQUALIZER_SETTINGS,
  onToggle,
  onSelectPreset,
  onUpdateBandGain,
  onUpdateBassBoost,
  onReset,
}: EqualizerModalProps): React.JSX.Element | null {
  if (!visible) return null;

  const isEnabled = settings.enabled;
  const currentPreset = EQUALIZER_PRESETS[settings.presetId] || EQUALIZER_PRESETS.flat;

  const formatGain = (gain: number): string => {
    if (gain > 0) return `+${gain} dB`;
    return `${gain} dB`;
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
                    <MaterialCommunityIcons name="tune-vertical" size={20} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.title}>Ecualizador de Audio</Text>
                    <Text style={styles.subtitle}>Calibración acústica de 5 bandas</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Switch de activación general */}
                <View style={[styles.powerBanner, isEnabled && styles.powerBannerActive]}>
                  <View style={styles.powerTextCol}>
                    <Text style={styles.powerTitle}>
                      {isEnabled ? 'Ecualizador Activo' : 'Ecualizador Desactivado'}
                    </Text>
                    <Text style={styles.powerDescription}>
                      {isEnabled
                        ? `Aplicando perfil acústico: ${currentPreset.name}`
                        : 'El audio se reproduce con la curva original sin procesar'}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={(val: boolean) => onToggle?.(val)}
                    trackColor={{ false: Colors.bgInput, true: Colors.accentAlpha30 }}
                    thumbColor={isEnabled ? Colors.accent : Colors.textMuted}
                  />
                </View>

                {/* Selector de Presets */}
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Presets Acústicos</Text>
                  <Text style={styles.presetInfoBadge}>{currentPreset.name}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetsScrollView}
                  contentContainerStyle={styles.presetsContentContainer}
                >
                  {(Object.keys(EQUALIZER_PRESETS) as EqualizerPresetId[]).map((presetKey) => {
                    const preset = EQUALIZER_PRESETS[presetKey];
                    const isActive = settings.presetId === presetKey;
                    return (
                      <TouchableOpacity
                        key={presetKey}
                        disabled={!isEnabled}
                        style={[
                          styles.presetPill,
                          isActive && styles.presetPillActive,
                          !isEnabled && { opacity: 0.5 },
                        ]}
                        onPress={() => onSelectPreset?.(presetKey)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.presetPillText, isActive && styles.presetPillTextActive]}>
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.presetDescriptionText}>
                  {currentPreset.description}
                </Text>

                {/* Refuerzo de graves (Bass Boost) */}
                <View style={[styles.bassBoostCard, !isEnabled && styles.bandCardDisabled]}>
                  <View style={styles.bassBoostHeader}>
                    <View style={styles.bassBoostTitleRow}>
                      <MaterialCommunityIcons name="speaker" size={18} color={Colors.accentLight} />
                      <Text style={styles.bassBoostTitle}>Refuerzo de Graves (Bass Boost)</Text>
                    </View>
                    <View style={[styles.gainBadge, settings.bassBoost > 0 && styles.gainBadgeBoost]}>
                      <Text style={[styles.gainText, settings.bassBoost > 0 && styles.gainTextBoost]}>
                        {settings.bassBoost > 0 ? `+${settings.bassBoost} dB` : '0 dB'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLimitText}>0</Text>
                    <Slider
                      style={styles.slider}
                      disabled={!isEnabled}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      value={settings.bassBoost}
                      onValueChange={(val: number) => onUpdateBassBoost?.(val)}
                      minimumTrackTintColor={Colors.accent}
                      maximumTrackTintColor={Colors.bgMid}
                      thumbTintColor={Colors.accentLight}
                    />
                    <Text style={styles.sliderLimitText}>+10</Text>
                  </View>
                </View>

                {/* 5 Bandas de Frecuencia */}
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Bandas de Frecuencia</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>-10 dB a +10 dB</Text>
                </View>

                <View style={styles.bandsWrapper}>
                  {settings.bands.map((band, idx) => {
                    const isBoost = band.gain > 0;
                    const isCut = band.gain < 0;

                    return (
                      <View
                        key={band.freq}
                        style={[styles.bandCard, !isEnabled && styles.bandCardDisabled]}
                      >
                        <View style={styles.bandHeader}>
                          <View style={styles.bandLabelRow}>
                            <Text style={styles.bandFreq}>{band.label}</Text>
                            <Text style={styles.bandSubLabel}>• {BAND_SUB_LABELS[idx]}</Text>
                          </View>
                          <View
                            style={[
                              styles.gainBadge,
                              isBoost && styles.gainBadgeBoost,
                              isCut && styles.gainBadgeCut,
                            ]}
                          >
                            <Text
                              style={[
                                styles.gainText,
                                isBoost && styles.gainTextBoost,
                                isCut && styles.gainTextCut,
                              ]}
                            >
                              {formatGain(band.gain)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.sliderRow}>
                          <Text style={styles.sliderLimitText}>-10</Text>
                          <Slider
                            style={styles.slider}
                            disabled={!isEnabled}
                            minimumValue={-10}
                            maximumValue={10}
                            step={1}
                            value={band.gain}
                            onValueChange={(val: number) => onUpdateBandGain?.(idx, val)}
                            minimumTrackTintColor={isCut ? '#EF4444' : Colors.accent}
                            maximumTrackTintColor={Colors.bgMid}
                            thumbTintColor={Colors.accentLight}
                          />
                          <Text style={styles.sliderLimitText}>+10</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Pie de controles */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={onReset}
                  disabled={!isEnabled}
                  activeOpacity={0.7}
                >
                  <Feather name="rotate-ccw" size={14} color={Colors.textTertiary} />
                  <Text style={styles.resetButtonText}>Plano</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
