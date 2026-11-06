/**
 * Utilidades para manejo seguro de carátulas (Artwork) en caché del dispositivo.
 * Previene desbordamiento de memoria SQLite CursorWindow (2MB) convirtiendo
 * imágenes binarias a archivos locales físicos en lugar de cadenas base64.
 */

import * as FileSystem from 'expo-file-system/legacy';

let isCoversDirReady = false;

/**
 * Calcula un hash numérico simple a partir de una cadena (usado para nombres únicos de carátula en caché).
 *
 * @param str Cadena base (usualmente la URI de la canción o ID)
 * @returns Cadena alfanumérica corta en base 36
 */
export function simpleHash(str?: string | null): string {
  if (!str) return '0';
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Asegura que el directorio de carátulas en caché exista en el sistema de archivos.
 */
export async function ensureCoversDirExists(): Promise<void> {
  if (isCoversDirReady) return;
  try {
    const coversDir = `${FileSystem.cacheDirectory}covers/`;
    const info = await FileSystem.getInfoAsync(coversDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(coversDir, { intermediates: true });
    }
    isCoversDirReady = true;
  } catch (e) {
    // Silencioso si falla la creación
  }
}

/**
 * Convierte un arreglo de bytes o ArrayBuffer a una cadena Base64 pura.
 *
 * @param bytes Secuencia de bytes en arreglo o Uint8Array
 * @returns Cadena codificada en Base64
 */
export function arrayBufferToBase64(bytes?: Uint8Array | number[] | null): string {
  if (!bytes || typeof bytes.length !== 'number' || bytes.length === 0) return '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    const chunk = (b1 << 16) | (b2 << 8) | b3;

    base64 += chars[(chunk >> 18) & 63];
    base64 += chars[(chunk >> 12) & 63];
    base64 += i + 1 < len ? chars[(chunk >> 6) & 63] : '=';
    base64 += i + 2 < len ? chars[chunk & 63] : '=';
  }
  return base64;
}

/**
 * Convierte una cadena Base64 a un Uint8Array para lectura directa de bytes.
 *
 * @param base64 Cadena en Base64
 * @returns Búfer de bytes en Uint8Array
 */
export function base64ToUint8Array(base64?: string | null): Uint8Array {
  if (!base64) return new Uint8Array(0);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}

/**
 * Guarda los datos de imagen extraídos de las etiquetas en el almacenamiento en caché del dispositivo.
 *
 * @param imageData Búfer de imagen en Base64, Uint8Array o array de números
 * @param format Formato de imagen (ej: 'image/jpeg', 'image/png')
 * @param fileUri URI del archivo de audio para calcular el hash del nombre
 * @returns Ruta local al archivo de carátula ('file:///...') o null si falló
 */
export async function saveArtworkToCache(
  imageData: string | Uint8Array | number[],
  format?: string | null,
  fileUri?: string | null
): Promise<string | null> {
  try {
    await ensureCoversDirExists();
    let base64 = '';
    if (typeof imageData === 'string') {
      base64 = imageData;
    } else if (imageData instanceof Uint8Array || Array.isArray(imageData)) {
      base64 = arrayBufferToBase64(imageData);
    }

    if (!base64) return null;

    const mime = format || 'image/jpeg';
    const ext = mime.toLowerCase().includes('png') ? 'png' : 'jpg';
    const hash = simpleHash(fileUri);
    const coverPath = `${FileSystem.cacheDirectory}covers/art_${hash}.${ext}`;

    await FileSystem.writeAsStringAsync(coverPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return coverPath;
  } catch (err) {
    console.warn('[MetadataExtractor] No se pudo guardar carátula en disco:', err);
    return null;
  }
}
