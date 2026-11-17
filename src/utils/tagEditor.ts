import { Track } from '../models/Track';
import { ID3_GENRES } from '../constants/genres';

export interface EditableTrackTags {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: string;
}

/**
 * Obtiene el módulo FileSystem de forma segura sin romper entornos Node de pruebas.
 */
function getFileSystem(): any {
  try {
    return require('expo-file-system/legacy');
  } catch {
    return null;
  }
}

/**
 * Convierte un Uint8Array a cadena Base64 pura de forma multiplataforma y segura.
 */
export function uint8ArrayToBase64(bytes?: Uint8Array | null): string {
  if (!bytes || bytes.length === 0) return '';
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
 * Convierte una cadena Base64 a un Uint8Array.
 */
function base64ToUint8Array(base64?: string | null): Uint8Array {
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
    if (encoded3 < 64) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 < 64) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }
  return bytes;
}

/**
 * Construye un bloque binario ID3v1.1 estándar de 128 bytes.
 */
export function buildId3v1Tag(tags: EditableTrackTags): Uint8Array {
  const buffer = new Uint8Array(128);

  // Cabecera 'TAG' (3 bytes)
  buffer[0] = 0x54; // 'T'
  buffer[1] = 0x41; // 'A'
  buffer[2] = 0x47; // 'G'

  const copyText = (text: string | undefined, offset: number, maxLen: number) => {
    if (!text) return;
    const trimmed = text.trim();
    for (let i = 0; i < maxLen && i < trimmed.length; i++) {
      buffer[offset + i] = trimmed.charCodeAt(i) & 0xff;
    }
  };

  // Título (30 bytes, offset 3)
  copyText(tags.title, 3, 30);
  // Artista (30 bytes, offset 33)
  copyText(tags.artist, 33, 30);
  // Álbum (30 bytes, offset 63)
  copyText(tags.album, 63, 30);
  // Año (4 bytes, offset 93)
  copyText(tags.year || new Date().getFullYear().toString(), 93, 4);
  // Comentario (28 bytes, offset 97)
  copyText('Vulpis Player', 97, 28);

  // Bandera de versión ID3v1.1 (byte 125 = 0x00)
  buffer[125] = 0x00;
  // Número de pista (byte 126 = 0x00)
  buffer[126] = 0x00;

  // Género musical (byte 127)
  let genreByte = 255; // Por defecto: Desconocido / Ninguno
  if (tags.genre) {
    const cleanG = tags.genre.trim().toLowerCase();
    const gIndex = ID3_GENRES.findIndex((g) => g.toLowerCase() === cleanG);
    if (gIndex !== -1) {
      genreByte = gIndex;
    } else {
      genreByte = 12; // 'Other'
    }
  }
  buffer[127] = genreByte;

  return buffer;
}

/**
 * Intenta escribir etiquetas físicas ID3v1 en un archivo MP3 local.
 * Si el archivo es de solo lectura o reside en un almacenamiento protegido,
 * retorna false limpiamente sin lanzar excepciones.
 */
export async function writePhysicalId3v1Tag(
  fileUri: string,
  tags: EditableTrackTags
): Promise<boolean> {
  if (!fileUri || typeof fileUri !== 'string') return false;

  const FileSystem = getFileSystem();
  if (!FileSystem) return false;

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists || fileInfo.isDirectory) {
      return false;
    }

    const tagBuffer = buildId3v1Tag(tags);
    const tagBase64 = uint8ArrayToBase64(tagBuffer);

    // Si el archivo tiene al menos 128 bytes, verificar si ya finaliza con 'TAG'
    if (fileInfo.size && fileInfo.size >= 128) {
      try {
        const last128Base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: fileInfo.size - 128,
          length: 128,
        });

        // Decodificar los primeros 3 bytes para ver si es 'TAG'
        let hasExistingTag = false;
        if (last128Base64) {
          const bytes = base64ToUint8Array(last128Base64);
          if (bytes.length >= 3 && bytes[0] === 0x54 && bytes[1] === 0x41 && bytes[2] === 0x47) {
            hasExistingTag = true;
          }
        }

        // Si no tiene etiqueta existente, podemos adjuntar los 128 bytes al final
        if (!hasExistingTag) {
          await FileSystem.writeAsStringAsync(fileUri, tagBase64, {
            encoding: FileSystem.EncodingType.Base64,
            append: true,
          });
          console.log('[TagEditor] Etiqueta ID3v1 adjuntada al final del archivo MP3:', fileUri);
          return true;
        }
      } catch (readErr) {
        console.warn('[TagEditor] No se pudo leer el final del archivo para ID3v1:', readErr);
      }
    }

    return false;
  } catch (err: any) {
    console.warn('[TagEditor] No se pudo escribir etiqueta física en disco:', err?.message);
    return false;
  }
}

/**
 * Limpia un título de canción eliminando sufijos comunes de descargas de YouTube/Web.
 * Ej: "Bohemian Rhapsody (Official Video) [Remastered].mp3" -> "Bohemian Rhapsody"
 */
export function cleanTrackTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;

  // Quitar extensión .mp3, .m4a, .flac, etc.
  cleaned = cleaned.replace(/\.(mp3|m4a|flac|wav|ogg|aac)$/i, '');

  // Quitar número de pista al inicio (ej: "01 - ", "01. ", "1. ")
  cleaned = cleaned.replace(/^\s*\d{1,3}[\s.\-_]+\s*/, '');

  // Quitar sufijos entre paréntesis o corchetes comunes
  cleaned = cleaned.replace(
    /\s*[\(\[](?:official\s*(?:video|audio|music\s*video|lyric\s*video)?|audio|video|lyrics?|remaster(?:ed)?|hd|hq|4k|visualizer)[\)\]]\s*/gi,
    ' '
  );

  // Quitar sufijos de bitrate o resolución (ej: "[320kbps]", "(1080p)")
  cleaned = cleaned.replace(/\s*[\(\[]\d+(?:kbps|k|p)[\)\]]\s*/gi, ' ');

  // Quitar espacios duplicados
  return cleaned.replace(/\s+/g, ' ').trim();
}
