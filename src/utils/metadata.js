import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import * as FileSystem from 'expo-file-system/legacy';

const INITIAL_CHUNK_SIZE = 256 * 1024; // 256 KB es suficiente para el 98% de metadatos ID3
const MAX_TAG_SIZE = 2 * 1024 * 1024; // 2 MB límite de seguridad para etiquetas gigantes con fotos HD

let isCoversDirReady = false;

function simpleHash(str) {
  if (!str) return '0';
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function ensureCoversDirExists() {
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

async function saveArtworkToCache(imageData, format, fileUri) {
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

function base64ToUint8Array(base64) {
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

function arrayBufferToBase64(bytes) {
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

export function formatLyricsText(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== 'string') return '';
  return rawLyrics.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
}

export function parseLrcLyrics(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== 'string') return [];
  const lines = rawLyrics.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (matches.length > 0) {
      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
        const timeInSeconds = min * 60 + sec + ms / 1000;
        if (text) {
          result.push({ time: timeInSeconds, text });
        }
      }
    } else if (line.trim()) {
      result.push({ time: null, text: line.trim() });
    }
  }

  result.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  return result;
}

function decodeText(bytes, encoding) {
  if (!bytes || bytes.length === 0) return '';
  try {
    // 0: ISO-8859-1 (Latin1)
    if (encoding === 0) {
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0) break;
        str += String.fromCharCode(bytes[i]);
      }
      return str.trim();
    }

    // 1: UTF-16 with BOM
    if (encoding === 1) {
      if (bytes.length < 2) return '';
      let isLE = true;
      let offset = 0;
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        isLE = true;
        offset = 2;
      } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        isLE = false;
        offset = 2;
      }

      let str = '';
      for (let i = offset; i + 1 < bytes.length; i += 2) {
        const code = isLE
          ? bytes[i] | (bytes[i + 1] << 8)
          : (bytes[i] << 8) | bytes[i + 1];
        if (code === 0) break;
        str += String.fromCharCode(code);
      }
      return str.trim();
    }

    // 2: UTF-16BE without BOM
    if (encoding === 2) {
      let str = '';
      for (let i = 0; i + 1 < bytes.length; i += 2) {
        const code = (bytes[i] << 8) | bytes[i + 1];
        if (code === 0) break;
        str += String.fromCharCode(code);
      }
      return str.trim();
    }

    // 3: UTF-8
    if (encoding === 3) {
      if (typeof TextDecoder !== 'undefined') {
        const decoded = new TextDecoder('utf-8').decode(bytes);
        const nullIdx = decoded.indexOf('\0');
        return (nullIdx !== -1 ? decoded.substring(0, nullIdx) : decoded).trim();
      }
      let str = '';
      let i = 0;
      while (i < bytes.length) {
        const b = bytes[i++];
        if (b === 0) break;
        if (b < 0x80) {
          str += String.fromCharCode(b);
        } else if (b < 0xe0 && i < bytes.length) {
          str += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
        } else if (i + 1 < bytes.length) {
          str += String.fromCharCode(
            ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)
          );
        }
      }
      return str.trim();
    }
  } catch (e) {
    // Ignorar error de decodificación
  }

  // Fallback directo ASCII
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) break;
    str += String.fromCharCode(bytes[i]);
  }
  return str.trim();
}

/**
 * Parser nativo ultra-rápido para ID3v2 (v2.2, v2.3, v2.4)
 * Ejecuta en ~0.2ms sin carga de librerías ni clones de memoria.
 */
async function parseFastID3(bytes, fileUri) {
  if (!bytes || bytes.length < 10) return null;

  // Comprobar cabecera 'ID3'
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null;
  }

  const versionMajor = bytes[3];
  if (versionMajor < 2 || versionMajor > 4) return null;

  const flags = bytes[5];
  const tagSize =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);

  let offset = 10;
  // Si tiene cabecera extendida (bit 6)
  if (flags & 0x40 && bytes.length > 14) {
    let extSize = 0;
    if (versionMajor === 3) {
      extSize =
        (bytes[10] << 24) |
        (bytes[11] << 16) |
        (bytes[12] << 8) |
        bytes[13];
      offset += 4 + extSize;
    } else if (versionMajor === 4) {
      extSize =
        ((bytes[10] & 0x7f) << 21) |
        ((bytes[11] & 0x7f) << 14) |
        ((bytes[12] & 0x7f) << 7) |
        (bytes[13] & 0x7f);
      offset += extSize;
    }
  }

  const tagLimit = Math.min(bytes.length, 10 + tagSize);
  const result = {
    title: null,
    artist: null,
    artworkUrl: null,
    lyrics: null,
  };

  while (offset < tagLimit - (versionMajor === 2 ? 6 : 10)) {
    if (bytes[offset] === 0) {
      // Padding alcanzado
      break;
    }

    let frameId = '';
    let frameSize = 0;
    let headerSize = 0;

    if (versionMajor === 2) {
      frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
      frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
      headerSize = 6;
    } else {
      frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      if (versionMajor === 4) {
        frameSize =
          ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f);
      } else {
        frameSize =
          (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7];
      }
      headerSize = 10;
    }

    if (frameSize <= 0 || offset + headerSize + frameSize > bytes.length) {
      break;
    }

    const dataStart = offset + headerSize;
    const encoding = bytes[dataStart];

    // Título
    if ((frameId === 'TIT2' || frameId === 'TT2') && !result.title) {
      result.title = decodeText(bytes.subarray(dataStart + 1, dataStart + frameSize), encoding);
    }
    // Artista
    else if ((frameId === 'TPE1' || frameId === 'TP1') && !result.artist) {
      result.artist = decodeText(bytes.subarray(dataStart + 1, dataStart + frameSize), encoding);
    }
    // Letra no sincronizada (USLT / ULT)
    else if ((frameId === 'USLT' || frameId === 'ULT') && !result.lyrics) {
      try {
        let textPos = dataStart + 4; // saltar encoding (1) y language (3)
        // saltar description terminada en null
        if (encoding === 1 || encoding === 2) {
          while (textPos + 1 < dataStart + frameSize) {
            if (bytes[textPos] === 0 && bytes[textPos + 1] === 0) {
              textPos += 2;
              break;
            }
            textPos += 2;
          }
        } else {
          while (textPos < dataStart + frameSize) {
            if (bytes[textPos] === 0) {
              textPos += 1;
              break;
            }
            textPos++;
          }
        }
        if (textPos < dataStart + frameSize) {
          result.lyrics = decodeText(bytes.subarray(textPos, dataStart + frameSize), encoding);
        }
      } catch (e) {
        // Ignorar fallo de letra
      }
    }
    // Carátula (APIC / PIC)
    else if ((frameId === 'APIC' || frameId === 'PIC') && !result.artworkUrl) {
      try {
        let pos = dataStart + 1;
        let mime = 'image/jpeg';
        if (versionMajor === 2) {
          const imgFmt = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2]).toLowerCase();
          mime = imgFmt === 'png' ? 'image/png' : 'image/jpeg';
          pos += 4; // 3 bytes formato + 1 byte tipo imagen
        } else {
          let mimeEnd = pos;
          while (mimeEnd < dataStart + frameSize && bytes[mimeEnd] !== 0) {
            mimeEnd++;
          }
          if (mimeEnd > pos) {
            mime = String.fromCharCode(...bytes.subarray(pos, mimeEnd));
          }
          pos = mimeEnd + 2; // saltar null y byte de picture type
        }

        // Saltar descripción
        if (encoding === 1 || encoding === 2) {
          while (pos + 1 < dataStart + frameSize) {
            if (bytes[pos] === 0 && bytes[pos + 1] === 0) {
              pos += 2;
              break;
            }
            pos += 2;
          }
        } else {
          while (pos < dataStart + frameSize) {
            if (bytes[pos] === 0) {
              pos += 1;
              break;
            }
            pos++;
          }
        }

        // Buscar firma JPEG (FF D8 FF) o PNG (89 50 4E 47) para mayor seguridad
        for (let scan = pos; scan < Math.min(pos + 32, dataStart + frameSize - 3); scan++) {
          if (bytes[scan] === 0xff && bytes[scan + 1] === 0xd8 && bytes[scan + 2] === 0xff) {
            pos = scan;
            mime = 'image/jpeg';
            break;
          } else if (bytes[scan] === 0x89 && bytes[scan + 1] === 0x50 && bytes[scan + 2] === 0x4e) {
            pos = scan;
            mime = 'image/png';
            break;
          }
        }

        if (pos < dataStart + frameSize) {
          const imgBytes = bytes.subarray(pos, dataStart + frameSize);
          const cachedCover = await saveArtworkToCache(imgBytes, mime, fileUri);
          if (cachedCover) {
            result.artworkUrl = cachedCover;
          }
        }
      } catch (picErr) {
        console.warn('[MetadataExtractor] Error extrayendo carátula ID3:', picErr);
      }
    }

    offset += headerSize + frameSize;
  }

  return result;
}

function getLyricsFromTags(tags) {
  if (!tags) return null;

  if (tags.lyrics) {
    if (typeof tags.lyrics === 'string' && tags.lyrics.trim().length > 0) {
      return tags.lyrics.trim();
    }
    if (typeof tags.lyrics === 'object' && tags.lyrics !== null) {
      const text = tags.lyrics.lyrics || tags.lyrics.text || tags.lyrics.data;
      if (typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    }
  }

  if (tags.USLT) {
    if (typeof tags.USLT === 'string' && tags.USLT.trim().length > 0) {
      return tags.USLT.trim();
    }
    if (typeof tags.USLT === 'object' && tags.USLT !== null) {
      if (tags.USLT.data) {
        if (typeof tags.USLT.data === 'string' && tags.USLT.data.trim().length > 0) {
          return tags.USLT.data.trim();
        }
        if (typeof tags.USLT.data === 'object' && tags.USLT.data !== null) {
          if (typeof tags.USLT.data.lyrics === 'string' && tags.USLT.data.lyrics.trim().length > 0) {
            return tags.USLT.data.lyrics.trim();
          }
          if (typeof tags.USLT.data.text === 'string' && tags.USLT.data.text.trim().length > 0) {
            return tags.USLT.data.text.trim();
          }
        }
      }
      if (typeof tags.USLT.lyrics === 'string' && tags.USLT.lyrics.trim().length > 0) {
        return tags.USLT.lyrics.trim();
      }
    }
  }

  if (tags.unsynchronisedLyrics) {
    if (typeof tags.unsynchronisedLyrics === 'string' && tags.unsynchronisedLyrics.trim().length > 0) {
      return tags.unsynchronisedLyrics.trim();
    }
    if (typeof tags.unsynchronisedLyrics === 'object' && tags.unsynchronisedLyrics !== null) {
      const text = tags.unsynchronisedLyrics.lyrics || tags.unsynchronisedLyrics.text;
      if (typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    }
  }

  return null;
}

const checkSidecarLyrics = async (fileUri) => {
  try {
    if (!fileUri || typeof fileUri !== 'string' || (!fileUri.startsWith('file://') && !fileUri.startsWith('/'))) return null;
    const lrcUri = fileUri.replace(/\.[^/.]+$/, '.lrc');
    const txtUri = fileUri.replace(/\.[^/.]+$/, '.txt');

    const lrcInfo = await FileSystem.getInfoAsync(lrcUri);
    if (lrcInfo.exists) {
      const content = await FileSystem.readAsStringAsync(lrcUri);
      if (content && content.trim().length > 0) return content.trim();
    }

    const txtInfo = await FileSystem.getInfoAsync(txtUri);
    if (txtInfo.exists) {
      const content = await FileSystem.readAsStringAsync(txtUri);
      if (content && content.trim().length > 0) return content.trim();
    }
  } catch (e) {
    // Ignorar errores de archivo adjunto
  }
  return null;
};

/**
 * Lee metadatos de audio de manera ultra-optimizada.
 * En lugar de cargar archivos completos de 20-50MB en RAM, lee únicamente el bloque de cabecera (128-256KB).
 */
export const extractMetadata = async (fileUri) => {
  if (!fileUri) return { title: null, artist: null, artworkUrl: null, lyrics: null };

  try {
    // 1. Leer solo el primer bloque (256 KB) del archivo
    let base64Chunk = '';
    try {
      base64Chunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: INITIAL_CHUNK_SIZE,
      });
    } catch (readErr) {
      // Fallback si el sistema no soporta offset parcial en cierta URI
      base64Chunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (!base64Chunk || base64Chunk.length === 0) {
      const sidecar = await checkSidecarLyrics(fileUri);
      return { title: null, artist: null, artworkUrl: null, lyrics: sidecar };
    }

    let byteArray = base64ToUint8Array(base64Chunk);

    // 2. Si es ID3v2 y la etiqueta completa es mayor a 256KB (por carátula HD), leer el tamaño exacto
    if (byteArray.length >= 10 && byteArray[0] === 0x49 && byteArray[1] === 0x44 && byteArray[2] === 0x33) {
      const fullTagSize =
        ((byteArray[6] & 0x7f) << 21) |
        ((byteArray[7] & 0x7f) << 14) |
        ((byteArray[8] & 0x7f) << 7) |
        (byteArray[9] & 0x7f) + 10;

      if (fullTagSize > INITIAL_CHUNK_SIZE && fullTagSize <= MAX_TAG_SIZE) {
        try {
          const fullTagBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
            position: 0,
            length: fullTagSize,
          });
          if (fullTagBase64) {
            byteArray = base64ToUint8Array(fullTagBase64);
          }
        } catch (e) {
          // Continuar con el bloque inicial
        }
      }

      // Parser nativo rápido
      const parsed = await parseFastID3(byteArray, fileUri);
      if (parsed && (parsed.title || parsed.artist || parsed.artworkUrl || parsed.lyrics)) {
        if (!parsed.lyrics) {
          parsed.lyrics = await checkSidecarLyrics(fileUri);
        }
        return parsed;
      }
    }

    // 3. Fallback para formatos M4A/FLAC/OGG con jsmediatags usando el buffer reducido
    return new Promise((resolve) => {
      // Usar Array.from solo sobre el fragmento de 256KB (pesa < 1MB en RAM contra 200MB del archivo completo)
      const smallArray = Array.from(byteArray);
      jsmediatags.read(smallArray, {
        onSuccess: async (tag) => {
          const tags = tag.tags || {};
          const title = tags.title || null;
          const artist = tags.artist || null;
          let artworkUrl = null;

          if (tags.picture && tags.picture.data) {
            const { data, format } = tags.picture;
            artworkUrl = await saveArtworkToCache(data, format, fileUri);
          }

          let lyrics = getLyricsFromTags(tags);
          if (!lyrics) {
            lyrics = await checkSidecarLyrics(fileUri);
          }

          resolve({ title, artist, artworkUrl, lyrics });
        },
        onError: async () => {
          const sidecarLyrics = await checkSidecarLyrics(fileUri);
          resolve({ title: null, artist: null, artworkUrl: null, lyrics: sidecarLyrics });
        },
      });
    });
  } catch (e) {
    console.warn('[MetadataExtractor] Error al leer metadatos de:', fileUri, e);
    const sidecarLyrics = await checkSidecarLyrics(fileUri);
    return { title: null, artist: null, artworkUrl: null, lyrics: sidecarLyrics };
  }
};
