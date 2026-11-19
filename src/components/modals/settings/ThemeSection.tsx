import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../../styles/SettingsModal.styles';
import { useTheme } from '../../../context/ThemeContext';
import { ThemeDefinition, ThemeId } from '../../../models/Theme';

export interface ThemeSectionProps {
  onShowToast?: (message: string) => void;
}

/**
 * Obtiene el icono representativo para cada tema visual.
 */
function getThemeIcon(id: ThemeId): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (id) {
    case 'amoled-black':
      return 'weather-night';
    case 'cyberpunk':
      return 'lightning-bolt';
    case 'emerald':
      return 'leaf';
    case 'dynamic':
      return 'auto-fix';
    case 'vulpis-violet':
    default:
      return 'palette-outline';
  }
}

/**
 * Sección modular de selección de Temas Visuales en el modal de Ajustes.
 * Permite alternar entre Violeta Vulpis, AMOLED Black, Cyberpunk, Esmeralda y Tema Dinámico.
 */
export default function ThemeSection({ onShowToast }: ThemeSectionProps): React.JSX.Element {
  const { themeId, availableThemes, setTheme, palette } = useTheme();

  const handleSelectTheme = async (selected: ThemeDefinition): Promise<void> => {
    if (selected.id === themeId) return;
    await setTheme(selected.id);
    if (onShowToast) {
      onShowToast(`Tema aplicado: ${selected.name}`);
    }
  };

  return (
    <View style={styles.settingSection}>
      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingLabel}>Tema visual y apariencia</Text>
          <Text style={styles.settingDescription}>
            Personaliza el contraste, acentos y colores de fondo del reproductor.
          </Text>
        </View>
        <MaterialCommunityIcons name="palette" size={24} color={palette.accent} />
      </View>

      <View style={styles.themeGrid}>
        {availableThemes.map((t) => {
          const isActive = t.id === themeId;
          const iconName = getThemeIcon(t.id);

          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeCard,
                isActive && [
                  styles.themeCardActive,
                  { borderColor: palette.accent, backgroundColor: palette.accentAlpha10 },
                ],
              ]}
              onPress={() => handleSelectTheme(t)}
              activeOpacity={0.75}
            >
              <View style={styles.themeCardTopRow}>
                <View style={styles.themeCardTitleContainer}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={18}
                    color={isActive ? palette.accent : '#94A3B8'}
                  />
                  <Text style={[styles.themeCardTitle, isActive && { color: palette.textPrimary }]}>
                    {t.name}
                  </Text>
                </View>

                {isActive && (
                  <View style={[styles.themeActiveBadge, { backgroundColor: palette.accentAlpha20 }]}>
                    <MaterialCommunityIcons name="check" size={12} color={palette.accentLight} />
                    <Text style={[styles.themeActiveBadgeText, { color: palette.accentLight }]}>
                      Activo
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.themeCardDescription}>{t.description}</Text>

              <View style={styles.themeCardBottomRow}>
                {/* Muestras de color del tema */}
                <View style={styles.themeSwatchesRow}>
                  <View
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: t.preview.base },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: t.preview.card },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeSwatch,
                      {
                        backgroundColor:
                          t.id === 'dynamic' && isActive
                            ? palette.accent
                            : t.preview.accent,
                      },
                    ]}
                  />
                </View>

                {t.isDynamic && (
                  <Text style={{ fontSize: 10, color: palette.accentLight, fontStyle: 'italic' }}>
                    Adaptativo
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
