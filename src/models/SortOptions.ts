import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Campos disponibles para el ordenamiento multicriterio de pistas.
 */
export type SortField = 'title' | 'artist' | 'album' | 'duration' | 'addedAt';

/**
 * Dirección del ordenamiento: ascendente o descendente.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Configuración activa de ordenamiento.
 */
export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

/**
 * Definición descriptiva de una opción de ordenamiento para la interfaz visual.
 */
export interface SortOptionItem {
  field: SortField;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  ascLabel: string;
  descLabel: string;
}

/**
 * Catálogo de criterios de ordenamiento disponibles en Vulpis.
 */
export const SORT_OPTIONS: SortOptionItem[] = [
  {
    field: 'title',
    label: 'Título',
    icon: 'format-letter-case',
    ascLabel: 'A - Z (Ascendente)',
    descLabel: 'Z - A (Descendente)',
  },
  {
    field: 'artist',
    label: 'Artista',
    icon: 'account-music',
    ascLabel: 'A - Z (Ascendente)',
    descLabel: 'Z - A (Descendente)',
  },
  {
    field: 'album',
    label: 'Álbum',
    icon: 'album',
    ascLabel: 'A - Z (Ascendente)',
    descLabel: 'Z - A (Descendente)',
  },
  {
    field: 'duration',
    label: 'Duración',
    icon: 'clock-outline',
    ascLabel: 'Más corta primero',
    descLabel: 'Más larga primero',
  },
  {
    field: 'addedAt',
    label: 'Fecha de adición',
    icon: 'calendar-clock',
    ascLabel: 'Más antiguas primero',
    descLabel: 'Más recientes primero',
  },
];

/**
 * Configuración predeterminada de ordenamiento: Título A-Z.
 */
export const DEFAULT_SORT_CONFIG: SortConfig = {
  field: 'title',
  order: 'asc',
};
