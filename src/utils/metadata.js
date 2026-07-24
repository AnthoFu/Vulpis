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
        onSuccess: (tag) => {
          const tags = tag.tags;
          console.log('[MetadataExtractor] onSuccess. Título:', tags.title, 'Artista:', tags.artist, 'TieneImagen:', !!tags.picture);
          const title = tags.title || null;
          const artist = tags.artist || null;
          let artworkUrl = null;

          if (tags.picture) {
            const { data, format } = tags.picture;
            const base64 = arrayBufferToBase64(data);
            artworkUrl = `data:${format};base64,${base64}`;
            console.log('[MetadataExtractor] Portada extraída exitosamente.');
          }

          resolve({ title, artist, artworkUrl });
        },
        onError: (error) => {
          console.log('[MetadataExtractor] Error de jsmediatags:', error);
          resolve({ title: null, artist: null, artworkUrl: null });
        }
      });
    } catch (e) {
      console.error('[MetadataExtractor] Error al leer el archivo:', e);
      resolve({ title: null, artist: null, artworkUrl: null });
    }
  });
};
