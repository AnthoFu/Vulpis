import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Track } from '../models/Track';
import {
  SortConfig,
  SortField,
  SortOrder,
  SORT_OPTIONS,
  DEFAULT_SORT_CONFIG,
} from '../models/SortOptions';

export const SORT_STORAGE_KEY = 'vulpis_library_sort_config';

/**
 * Ordena una colección de canciones de forma inmutable según el campo y orden configurados.
 *
 * @param tracks Arreglo de canciones a ordenar
 * @param config Configuración de ordenamiento (campo y dirección)
 * @returns Nuevo arreglo de canciones ordenadas
 */
export function sortTracks(tracks: Track[], config: SortConfig = DEFAULT_SORT_CONFIG): Track[] {
  if (!tracks || tracks.length <= 1) return tracks ? [...tracks] : [];

  const { field, order } = config;
  const isAsc = order === 'asc';
  const multiplier = isAsc ? 1 : -1;

  return [...tracks].sort((a, b) => {
    switch (field) {
      case 'title': {
        const valA = (a.title || '').trim();
        const valB = (b.title || '').trim();
        return valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true }) * multiplier;
      }
      case 'artist': {
        const valA = (a.artist || '').trim();
        const valB = (b.artist || '').trim();
        return valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true }) * multiplier;
      }
      case 'album': {
        const valA = (a.album || '').trim();
        const valB = (b.album || '').trim();
        return valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true }) * multiplier;
      }
      case 'duration': {
        const valA = typeof a.duration === 'number' && !isNaN(a.duration) ? a.duration : 0;
        const valB = typeof b.duration === 'number' && !isNaN(b.duration) ? b.duration : 0;
        return (valA - valB) * multiplier;
      }
      case 'addedAt': {
        const valA = typeof a.addedAt === 'number' && !isNaN(a.addedAt) ? a.addedAt : 0;
        const valB = typeof b.addedAt === 'number' && !isNaN(b.addedAt) ? b.addedAt : 0;
        return (valA - valB) * multiplier;
      }
      default:
        return 0;
    }
  });
}

/**
 * Obtiene la etiqueta descriptiva legible del criterio de ordenamiento activo.
 */
export function getSortDescription(config: SortConfig): string {
  const item = SORT_OPTIONS.find((opt) => opt.field === config.field);
  if (!item) return 'Título (A - Z)';
  return `${item.label}: ${config.order === 'asc' ? item.ascLabel : item.descLabel}`;
}

/**
 * Obtiene el icono representativo del ordenamiento para la interfaz visual.
 */
export function getSortIcon(config: SortConfig): keyof typeof MaterialCommunityIcons.glyphMap {
  const { field, order } = config;
  switch (field) {
    case 'title':
      return order === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending';
    case 'artist':
      return order === 'asc' ? 'sort-alphabetical-ascending-variant' : 'sort-alphabetical-descending-variant';
    case 'duration':
      return order === 'asc' ? 'sort-numeric-ascending' : 'sort-numeric-descending';
    case 'addedAt':
      return order === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending';
    case 'album':
    default:
      return order === 'asc' ? 'sort-ascending' : 'sort-descending';
  }
}

/**
 * Guarda la preferencia de ordenamiento en AsyncStorage.
 */
export async function saveSortConfig(config: SortConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[trackSort] Error al guardar configuración de ordenamiento:', e);
  }
}

/**
 * Recupera la preferencia de ordenamiento persistida en AsyncStorage.
 */
export async function getStoredSortConfig(): Promise<SortConfig> {
  try {
    const raw = await AsyncStorage.getItem(SORT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.field === 'string' && typeof parsed.order === 'string') {
        const validFields: SortField[] = ['title', 'artist', 'album', 'duration', 'addedAt'];
        const validOrders: SortOrder[] = ['asc', 'desc'];
        if (validFields.includes(parsed.field) && validOrders.includes(parsed.order)) {
          return parsed as SortConfig;
        }
      }
    }
  } catch (e) {
    console.error('[trackSort] Error al cargar configuración de ordenamiento:', e);
  }
  return DEFAULT_SORT_CONFIG;
}
