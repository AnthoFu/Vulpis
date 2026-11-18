/**
 * Servicio para la gestión, auditoría y limpieza del almacenamiento y caché de Vulpis.
 * Permite calcular el espacio en disco ocupado por canciones descargadas de Google Drive,
 * carátulas de álbumes y letras en línea, con opciones de limpieza selectiva o total.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LYRICS_CACHE_KEY = 'vulpis_online_lyrics_cache';
const WEB_AUDIO_CACHE_NAME = 'vulpis-web-audio-v1';
const WEB_LYRICS_CACHE_NAME = 'vulpis-lyrics-v1';

/**
 * Obtiene el módulo FileSystem de forma segura y perezosa
 * para evitar excepciones en entornos Web o pruebas unitarias de Node.
 */
function getFileSystem(): any {
  try {
    return require('expo-file-system/legacy');
  } catch {
    try {
      return require('expo-file-system');
    } catch {
      return null;
    }
  }
}

/**
 * Estadísticas descriptivas de una categoría de almacenamiento.
 */
export interface StorageCategoryStats {
  /** Tamaño en bytes */
  sizeBytes: number;
  /** Cantidad de archivos o elementos almacenados */
  count: number;
  /** Representación legible en KB, MB o GB */
  formattedSize: string;
}

/**
 * Resumen consolidado del estado del almacenamiento y cachés.
 */
export interface StorageBreakdown {
  /** Canciones descargadas de Google Drive a la memoria local/caché */
  driveAudio: StorageCategoryStats;
  /** Portadas de álbumes descargadas o extraídas a caché */
  artwork: StorageCategoryStats;
  /** Letras de canciones consultadas en LRCLIB y guardadas en AsyncStorage */
  lyrics: StorageCategoryStats;
  /** Espacio total ocupado por todos los cachés de Vulpis */
  total: {
    sizeBytes: number;
    formattedSize: string;
  };
  /** Marca de tiempo de la última lectura */
  lastCalculatedAt: number;
}

/**
 * Resultado de una operación de limpieza de caché.
 */
export interface StorageClearResult {
  success: boolean;
  freedBytes: number;
  itemCount: number;
  category: 'driveAudio' | 'artwork' | 'lyrics' | 'all';
}

/**
 * Formatea un número de bytes en una cadena legible (B, KB, MB, GB).
 *
 * @param bytes Cantidad de bytes
 * @param decimals Número de decimales a redondear (por defecto 1)
 * @returns Cadena con unidad (ej. "45.2 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Calcula con precisión el tamaño en bytes de una cadena UTF-8.
 */
function getUtf8ByteSize(str: string): number {
  if (!str) return 0;
  if (typeof Blob !== 'undefined') {
    try {
      return new Blob([str]).size;
    } catch {}
  }
  const globalAny = globalThis as any;
  if (typeof globalAny.Buffer !== 'undefined') {
    try {
      return globalAny.Buffer.byteLength(str, 'utf8');
    } catch {}
  }
  return encodeURI(str).split(/%..|./).length - 1;
}

/**
 * Calcula el desglose completo del almacenamiento ocupado por Vulpis en el dispositivo.
 *
 * @returns Desglose de cachés de Drive, carátulas y letras
 */
export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  const FileSystem = getFileSystem();

  let driveAudioBytes = 0;
  let driveAudioCount = 0;

  let artworkBytes = 0;
  let artworkCount = 0;

  let lyricsBytes = 0;
  let lyricsCount = 0;

  // 1. Auditar archivos locales de FileSystem (Móvil)
  if (FileSystem && FileSystem.cacheDirectory) {
    try {
      const rootFiles: string[] = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).catch(() => []);

      for (const file of rootFiles) {
        const fileUri = `${FileSystem.cacheDirectory}${file}`;
        const lower = file.toLowerCase();

        // Audio de Google Drive (.mp3, .m4a, .wav, .flac)
        if (lower.endsWith('.mp3') || lower.endsWith('.m4a') || lower.endsWith('.wav') || lower.endsWith('.flac')) {
          const info = await FileSystem.getInfoAsync(fileUri).catch(() => null);
          if (info && info.exists && typeof info.size === 'number') {
            driveAudioBytes += info.size;
            driveAudioCount++;
          }
        }
        // Carátulas sueltas en raíz de caché (.jpg, .jpeg, .png, .webp)
        else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
          const info = await FileSystem.getInfoAsync(fileUri).catch(() => null);
          if (info && info.exists && typeof info.size === 'number') {
            artworkBytes += info.size;
            artworkCount++;
          }
        }
      }

      // Directorio dedicado de carátulas: cache/covers/
      const coversDir = `${FileSystem.cacheDirectory}covers/`;
      const coversDirInfo = await FileSystem.getInfoAsync(coversDir).catch(() => ({ exists: false }));

      if (coversDirInfo && coversDirInfo.exists) {
        const coverFiles: string[] = await FileSystem.readDirectoryAsync(coversDir).catch(() => []);
        for (const file of coverFiles) {
          const coverUri = `${coversDir}${file}`;
          const info = await FileSystem.getInfoAsync(coverUri).catch(() => null);
          if (info && info.exists && typeof info.size === 'number') {
            artworkBytes += info.size;
            artworkCount++;
          }
        }
      }
    } catch (fsErr) {
      console.warn('[StorageService] Error al auditar FileSystem en caché:', fsErr);
    }
  }

  // 2. Auditar Caché de Letras en AsyncStorage
  try {
    const rawLyrics = await AsyncStorage.getItem(LYRICS_CACHE_KEY);
    if (rawLyrics) {
      lyricsBytes = getUtf8ByteSize(rawLyrics);
      try {
        const parsed = JSON.parse(rawLyrics);
        lyricsCount = Object.keys(parsed).length;
      } catch {
        lyricsCount = 1;
      }
    }
  } catch (lyricsErr) {
    console.warn('[StorageService] Error al auditar caché de letras en AsyncStorage:', lyricsErr);
  }

  // 3. Soporte para Entornos Web (Cache Storage API)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.caches) {
    try {
      const hasAudioCache = await window.caches.has(WEB_AUDIO_CACHE_NAME);
      if (hasAudioCache) {
        const audioCache = await window.caches.open(WEB_AUDIO_CACHE_NAME);
        const audioReqs = await audioCache.keys();
        driveAudioCount += audioReqs.length;
        // Estimación estándar de ~4MB por canción en Web Audio Cache si no hay size exacto en FileSystem
        if (driveAudioBytes === 0) {
          driveAudioBytes = audioReqs.length * 4 * 1024 * 1024;
        }
      }

      const hasLyricsCache = await window.caches.has(WEB_LYRICS_CACHE_NAME);
      if (hasLyricsCache) {
        const lyrCache = await window.caches.open(WEB_LYRICS_CACHE_NAME);
        const lyrReqs = await lyrCache.keys();
        if (lyricsCount === 0) {
          lyricsCount = lyrReqs.length;
          lyricsBytes = lyrReqs.length * 2048; // ~2KB por letra
        }
      }
    } catch (webCacheErr) {
      console.warn('[StorageService] Error consultando Cache API en Web:', webCacheErr);
    }
  }

  const totalBytes = driveAudioBytes + artworkBytes + lyricsBytes;

  return {
    driveAudio: {
      sizeBytes: driveAudioBytes,
      count: driveAudioCount,
      formattedSize: formatBytes(driveAudioBytes),
    },
    artwork: {
      sizeBytes: artworkBytes,
      count: artworkCount,
      formattedSize: formatBytes(artworkBytes),
    },
    lyrics: {
      sizeBytes: lyricsBytes,
      count: lyricsCount,
      formattedSize: formatBytes(lyricsBytes),
    },
    total: {
      sizeBytes: totalBytes,
      formattedSize: formatBytes(totalBytes),
    },
    lastCalculatedAt: Date.now(),
  };
}

/**
 * Elimina todas las pistas de música de Google Drive almacenadas en la caché local.
 */
export async function clearDriveAudioCache(): Promise<StorageClearResult> {
  const FileSystem = getFileSystem();
  let freedBytes = 0;
  let count = 0;

  if (FileSystem && FileSystem.cacheDirectory) {
    try {
      const files: string[] = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).catch(() => []);

      for (const file of files) {
        const lower = file.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.m4a') || lower.endsWith('.wav') || lower.endsWith('.flac')) {
          const fileUri = `${FileSystem.cacheDirectory}${file}`;
          const info = await FileSystem.getInfoAsync(fileUri).catch(() => null);
          if (info && info.exists) {
            if (typeof info.size === 'number') freedBytes += info.size;
            await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
            count++;
          }
        }
      }
    } catch (e) {
      console.error('[StorageService] Error al limpiar caché de audio en FileSystem:', e);
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.caches) {
    try {
      await window.caches.delete(WEB_AUDIO_CACHE_NAME);
    } catch (e) {
      console.warn('[StorageService] Error al eliminar web audio cache:', e);
    }
  }

  return {
    success: true,
    freedBytes,
    itemCount: count,
    category: 'driveAudio',
  };
}

/**
 * Elimina todas las carátulas de álbumes almacenadas en la caché temporal.
 */
export async function clearArtworkCache(): Promise<StorageClearResult> {
  const FileSystem = getFileSystem();
  let freedBytes = 0;
  let count = 0;

  if (FileSystem && FileSystem.cacheDirectory) {
    try {
      // 1. Limpiar subdirectorio cache/covers/
      const coversDir = `${FileSystem.cacheDirectory}covers/`;
      const coversInfo = await FileSystem.getInfoAsync(coversDir).catch(() => ({ exists: false }));

      if (coversInfo && coversInfo.exists) {
        const coverFiles: string[] = await FileSystem.readDirectoryAsync(coversDir).catch(() => []);
        for (const file of coverFiles) {
          const fileUri = `${coversDir}${file}`;
          const info = await FileSystem.getInfoAsync(fileUri).catch(() => null);
          if (info && info.exists) {
            if (typeof info.size === 'number') freedBytes += info.size;
            await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
            count++;
          }
        }
        // Asegurar que el directorio de covers exista para descargas posteriores
        await FileSystem.makeDirectoryAsync(coversDir, { intermediates: true }).catch(() => {});
      }

      // 2. Limpiar imágenes sueltas en la raíz de caché
      const rootFiles: string[] = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).catch(() => []);
      for (const file of rootFiles) {
        const lower = file.toLowerCase();
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
          const fileUri = `${FileSystem.cacheDirectory}${file}`;
          const info = await FileSystem.getInfoAsync(fileUri).catch(() => null);
          if (info && info.exists) {
            if (typeof info.size === 'number') freedBytes += info.size;
            await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
            count++;
          }
        }
      }
    } catch (e) {
      console.error('[StorageService] Error al limpiar caché de carátulas:', e);
    }
  }

  return {
    success: true,
    freedBytes,
    itemCount: count,
    category: 'artwork',
  };
}

/**
 * Elimina las letras en línea cacheadas de LRCLIB en AsyncStorage.
 */
export async function clearLyricsStorageCache(): Promise<StorageClearResult> {
  let freedBytes = 0;
  let count = 0;

  try {
    const rawLyrics = await AsyncStorage.getItem(LYRICS_CACHE_KEY);
    if (rawLyrics) {
      freedBytes = getUtf8ByteSize(rawLyrics);
      try {
        const parsed = JSON.parse(rawLyrics);
        count = Object.keys(parsed).length;
      } catch {
        count = 1;
      }
    }
    await AsyncStorage.removeItem(LYRICS_CACHE_KEY);
  } catch (e) {
    console.error('[StorageService] Error al limpiar caché de letras:', e);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.caches) {
    try {
      await window.caches.delete(WEB_LYRICS_CACHE_NAME);
    } catch (e) {
      console.warn('[StorageService] Error al limpiar caché de letras en web:', e);
    }
  }

  return {
    success: true,
    freedBytes,
    itemCount: count,
    category: 'lyrics',
  };
}

/**
 * Elimina la totalidad de los archivos en caché de Vulpis (audio de Drive, carátulas y letras).
 */
export async function clearAllStorageCache(): Promise<{
  success: boolean;
  totalFreedBytes: number;
  formattedFreed: string;
}> {
  const [audioResult, artworkResult, lyricsResult] = await Promise.all([
    clearDriveAudioCache(),
    clearArtworkCache(),
    clearLyricsStorageCache(),
  ]);

  const totalFreedBytes = audioResult.freedBytes + artworkResult.freedBytes + lyricsResult.freedBytes;

  return {
    success: audioResult.success && artworkResult.success && lyricsResult.success,
    totalFreedBytes,
    formattedFreed: formatBytes(totalFreedBytes),
  };
}
