/**
 * Exportaciones centralizadas de hooks personalizados de Vulpis.
 * Estandariza el acceso a la lógica de dominio, controladores y estado.
 */

// Orquestador maestro
export { default as useAppController } from './useAppController';

// Reproductor nativo y sincronización
export { default as usePlayerInitializer } from './usePlayerInitializer';
export { default as usePlayerStateSync } from './usePlayerStateSync';
export { default as usePlayerPersistence } from './usePlayerPersistence';
export { default as useQueueController } from './useQueueController';

// Fuentes de música y almacenamiento
export { default as useLocalLibrary } from './useLocalLibrary';
export { default as useGoogleDrive } from './useGoogleDrive';
export { default as useDrivePrefetch } from './useDrivePrefetch';
export { default as usePlaylists } from './usePlaylists';

// Efectos de audio y utilidades
export { default as useAudioSettings } from './useAudioSettings';
export { default as useSleepTimer } from './useSleepTimer';
export { default as useSyncedLyrics } from './useSyncedLyrics';
export { default as useToast } from './useToast';

// Controladores específicos de componentes
export { default as usePlayerCard } from './usePlayerCard';
export { default as useMiniPlayer } from './useMiniPlayer';
export { default as useControls } from './useControls';
export { default as useProgressBar } from './useProgressBar';
export { default as useQueueList } from './useQueueList';
export { default as useSheetAnimation } from './useSheetAnimation';
export { default as useSidebarDrawer } from './useSidebarDrawer';
