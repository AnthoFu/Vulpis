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
      console.log('[MetadataExtractor] Reading file as base64:', fileUri);
      
      // Read local file as base64 string using expo-file-system
      const base64String = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[MetadataExtractor] Decoding base64 to byte array...');
      const byteArray = base64ToUint8Array(base64String);
      const standardArray = Array.from(byteArray);

      console.log('[MetadataExtractor] Extracting tags with jsmediatags...');
      jsmediatags.read(standardArray, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          console.log('[MetadataExtractor] onSuccess. Title:', tags.title, 'Artist:', tags.artist, 'HasPicture:', !!tags.picture);
          const title = tags.title || null;
          const artist = tags.artist || null;
          let artworkUrl = null;

          if (tags.picture) {
            const { data, format } = tags.picture;
            const base64 = arrayBufferToBase64(data);
            artworkUrl = `data:${format};base64,${base64}`;
            console.log('[MetadataExtractor] Successfully extracted artwork.');
          }

          resolve({ title, artist, artworkUrl });
        },
        onError: (error) => {
          console.log('[MetadataExtractor] jsmediatags error:', error);
          resolve({ title: null, artist: null, artworkUrl: null });
        }
      });
    } catch (e) {
      console.error('[MetadataExtractor] File reading error:', e);
      resolve({ title: null, artist: null, artworkUrl: null });
    }
  });
};
