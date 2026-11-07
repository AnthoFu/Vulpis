import { Image } from 'react-native';
import type { Track } from '../models/Track';

export const defaultCover: string = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

// Canciones locales vacías por defecto (se escanean automáticamente del dispositivo)
export const localTracks: Track[] = [];

export const privateTracks: Track[] = [];

// Respaldo para compatibilidad con la base de código existente
export const trackQueue: Track[] = localTracks;
