import { Image } from 'react-native';

const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

// Canciones locales vacías por defecto (se escanean automáticamente del dispositivo)
export const localTracks = [];

export const privateTracks = [];

// Respaldo para compatibilidad con la base de código existente
export const trackQueue = localTracks;

