/**
 * =============================================================================
 * Contexto de Temas Visuales — Vulpis
 * =============================================================================
 *
 * Provee la paleta de colores activa, la persistencia del tema en AsyncStorage
 * y la extracción dinámica de colores basada en la carátula de la pista en reproducción.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageColors from 'react-native-image-colors';
import { ThemeDefinition, ThemeId, ThemePalette } from '../models/Theme';
import {
  THEMES,
  THEME_LIST,
  DEFAULT_THEME_ID,
  buildDynamicPalette,
} from '../constants/themes';
import { PlayerContext } from './PlayerContext';

export const THEME_STORAGE_KEY = 'vulpis_theme_id';

export interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  palette: ThemePalette;
  availableThemes: ThemeDefinition[];
  isDynamic: boolean;
  setTheme: (id: ThemeId) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: ThemeId;
}

export function ThemeProvider({
  children,
  initialThemeId,
}: ThemeProviderProps): React.JSX.Element {
  const [themeId, setThemeIdState] = useState<ThemeId>(initialThemeId || DEFAULT_THEME_ID);
  const [dynamicPrimaryColor, setDynamicPrimaryColor] = useState<string>('#8B5CF6');

  const player = useContext(PlayerContext);
  const activeArtworkUrl = player?.activeTrack?.artworkUrl;

  // Cargar preferencia persistida al montar
  useEffect(() => {
    let isMounted = true;
    async function loadStoredTheme(): Promise<void> {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && (stored in THEMES) && isMounted) {
          setThemeIdState(stored as ThemeId);
        }
      } catch (err) {
        console.warn('[ThemeProvider] Error al cargar tema de AsyncStorage:', err);
      }
    }
    loadStoredTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extraer color dinámico si el tema activo es 'dynamic'
  useEffect(() => {
    if (themeId !== 'dynamic' || !activeArtworkUrl) {
      return;
    }

    let isMounted = true;
    async function extractArtworkColor(): Promise<void> {
      try {
        const result = await ImageColors.getColors(activeArtworkUrl!, {
          fallback: '#8B5CF6',
          cache: true,
          key: activeArtworkUrl || undefined,
        });

        let extracted = '#8B5CF6';
        if (result.platform === 'android') {
          extracted = result.vibrant || result.dominant || result.darkVibrant || '#8B5CF6';
        } else if (result.platform === 'ios') {
          extracted = result.primary || result.background || '#8B5CF6';
        } else if (result.platform === 'web') {
          extracted = (result as { dominant?: string }).dominant || '#8B5CF6';
        }

        if (isMounted && extracted) {
          setDynamicPrimaryColor(extracted);
        }
      } catch (err) {
        console.warn('[ThemeProvider] No se pudo extraer color de carátula:', err);
      }
    }

    extractArtworkColor();
    return () => {
      isMounted = false;
    };
  }, [themeId, activeArtworkUrl]);

  // Cambiar tema y persistir
  const setTheme = useCallback(async (newId: ThemeId): Promise<void> => {
    setThemeIdState(newId);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newId);
    } catch (err) {
      console.warn('[ThemeProvider] Error al guardar tema en AsyncStorage:', err);
    }
  }, []);

  const baseTheme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const isDynamic = themeId === 'dynamic';

  const palette = useMemo<ThemePalette>(() => {
    if (isDynamic) {
      return buildDynamicPalette(dynamicPrimaryColor);
    }
    return baseTheme.palette;
  }, [isDynamic, dynamicPrimaryColor, baseTheme]);

  const theme = useMemo<ThemeDefinition>(() => {
    if (isDynamic) {
      return {
        ...baseTheme,
        palette,
        preview: {
          base: palette.bgBase,
          card: palette.bgCard,
          accent: palette.accent,
        },
      };
    }
    return baseTheme;
  }, [isDynamic, baseTheme, palette]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme,
      palette,
      availableThemes: THEME_LIST,
      isDynamic,
      setTheme,
    }),
    [themeId, theme, palette, isDynamic, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acceder a la paleta de colores y configuración del tema activo.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un <ThemeProvider />');
  }
  return context;
}
