/**
 * Exportaciones centralizadas de hooks personalizados de Vulpis en TypeScript.
 * Estandariza el acceso a la lógica de dominio, controladores y estado.
 */

// Orquestador maestro
export { default as useAppController } from './useAppController';
export * from './useAppController';

// Reproductor nativo y sincronización
export { default as usePlayerInitializer } from './usePlayerInitializer';
export * from './usePlayerInitializer';
export { default as usePlayerStateSync } from './usePlayerStateSync';
export * from './usePlayerStateSync';
export { default as usePlayerPersistence } from './usePlayerPersistence';
export * from './usePlayerPersistence';
export { default as useQueueController } from './useQueueController';
export * from './useQueueController';

// Fuentes de música y almacenamiento
export { default as useLocalLibrary } from './useLocalLibrary';
export * from './useLocalLibrary';
export { default as useGoogleDrive } from './useGoogleDrive';
export * from './useGoogleDrive';
export { default as useDrivePrefetch } from './useDrivePrefetch';
export * from './useDrivePrefetch';
export { default as usePlaylists } from './usePlaylists';
export * from './usePlaylists';

// Efectos de audio y utilidades
export { default as useAudioSettings } from './useAudioSettings';
export * from './useAudioSettings';
export { default as useEqualizer } from './useEqualizer';
export * from './useEqualizer';
export { default as useSleepTimer } from './useSleepTimer';
export * from './useSleepTimer';
export { default as useSyncedLyrics } from './useSyncedLyrics';
export * from './useSyncedLyrics';
export { default as useToast } from './useToast';
export * from './useToast';

// Controladores específicos de componentes
export { default as usePlayerCard } from './usePlayerCard';
export * from './usePlayerCard';
export { default as useMiniPlayer } from './useMiniPlayer';
export * from './useMiniPlayer';
export { default as useControls } from './useControls';
export * from './useControls';
export { default as useProgressBar } from './useProgressBar';
export * from './useProgressBar';
export { default as useQueueList } from './useQueueList';
export * from './useQueueList';
export { default as useSheetAnimation } from './useSheetAnimation';
export * from './useSheetAnimation';
export { default as useSidebarDrawer } from './useSidebarDrawer';
export * from './useSidebarDrawer';
