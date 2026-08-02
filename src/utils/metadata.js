import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import * as FileSystem from 'expo-file-system/legacy';

function base64ToUint8Array(base64) {
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
  // Elimina marcas de tiempo tipo [00:12.34] o [01:23] para mostrar texto limpio
  const cleaned = rawLyrics.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
  return cleaned;
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

export const extractMetadata = async (fileUri) => {
  return new Promise(async (resolve) => {
    try {
      console.log('[MetadataExtractor] Leyendo archivo como base64:', fileUri);
      
      // Leer archivo local como cadena base64 usando expo-file-system
      const base64String = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[MetadataExtractor] Decodificando base64 a arreglo de bytes...');
      const byteArray = base64ToUint8Array(base64String);
      const standardArray = Array.from(byteArray);

      console.log('[MetadataExtractor] Extrayendo etiquetas con jsmediatags...');
      jsmediatags.read(standardArray, {
        onSuccess: async (tag) => {
          const tags = tag.tags || {};
          console.log('[MetadataExtractor] onSuccess. Título:', tags.title, 'Artista:', tags.artist, 'TieneImagen:', !!tags.picture);
          const title = tags.title || null;
          const artist = tags.artist || null;
          let artworkUrl = null;

          if (tags.picture && tags.picture.data) {
            const { data, format } = tags.picture;
            const base64 = arrayBufferToBase64(data);
            if (base64) {
              artworkUrl = `data:${format || 'image/jpeg'};base64,${base64}`;
              console.log('[MetadataExtractor] Portada extraída exitosamente.');
            }
          }

          let lyrics = getLyricsFromTags(tags);
          if (!lyrics) {
            lyrics = await checkSidecarLyrics(fileUri);
          }
          if (lyrics) {
            console.log('[MetadataExtractor] Letra de la canción extraída exitosamente.');
          }

          resolve({ title, artist, artworkUrl, lyrics });
        },
        onError: async (error) => {
          console.log('[MetadataExtractor] Error de jsmediatags:', error);
          const sidecarLyrics = await checkSidecarLyrics(fileUri);
          resolve({ title: null, artist: null, artworkUrl: null, lyrics: sidecarLyrics });
        }
      });
    } catch (e) {
      console.error('[MetadataExtractor] Error al leer el archivo:', e);
      const sidecarLyrics = await checkSidecarLyrics(fileUri);
      resolve({ title: null, artist: null, artworkUrl: null, lyrics: sidecarLyrics });
    }
  });
};

