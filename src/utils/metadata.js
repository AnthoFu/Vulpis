import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import * as FileSystem from 'expo-file-system/legacy';
import { extractReplayGainFromJsMediaTags } from './replayGain';
import { base64ToUint8Array, saveArtworkToCache } from './artwork';
import { cleanGenreString, parseFastID3 } from './id3Parser';
import { formatLyricsText, parseLrcLyrics, getLyricsFromTags, checkSidecarLyrics } from './lyrics';

// Re-exportar utilidades para compatibilidad absoluta con todos los módulos existentes
export { cleanGenreString } from './id3Parser';
export { formatLyricsText, parseLrcLyrics } from './lyrics';

const INITIAL_CHUNK_SIZE = 256 * 1024; // 256 KB es suficiente para el 98% de metadatos ID3
const MAX_TAG_SIZE = 2 * 1024 * 1024; // 2 MB límite de seguridad para etiquetas gigantes con fotos HD

/**
 * Lee metadatos de audio de manera ultra-optimizada.
 * En lugar de cargar archivos completos de 20-50MB en RAM, lee únicamente el bloque de cabecera (128-256KB).
 */
export const extractMetadata = async (fileUri) => {
  if (!fileUri) {
    return {
      title: null,
      artist: null,
      album: null,
      genre: null,
      artworkUrl: null,
      lyrics: null,
      replayGain: null,
    };
  }

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
      return {
        title: null,
        artist: null,
        album: null,
        genre: null,
        artworkUrl: null,
        lyrics: sidecar,
        replayGain: null,
      };
    }

    let byteArray = base64ToUint8Array(base64Chunk);

    // 2. Si es ID3v2 y la etiqueta completa es mayor a 256KB (por carátula HD), leer el tamaño exacto
    if (
      byteArray.length >= 10 &&
      byteArray[0] === 0x49 &&
      byteArray[1] === 0x44 &&
      byteArray[2] === 0x33
    ) {
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
      if (
        parsed &&
        (parsed.title ||
          parsed.artist ||
          parsed.album ||
          parsed.genre ||
          parsed.artworkUrl ||
          parsed.lyrics ||
          parsed.replayGain)
      ) {
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
          const album = tags.album || null;
          const genre = cleanGenreString(tags.genre) || null;
          let artworkUrl = null;

          if (tags.picture && tags.picture.data) {
            const { data, format } = tags.picture;
            artworkUrl = await saveArtworkToCache(data, format, fileUri);
          }

          let lyrics = getLyricsFromTags(tags);
          if (!lyrics) {
            lyrics = await checkSidecarLyrics(fileUri);
          }

          const replayGain = extractReplayGainFromJsMediaTags(tags);

          resolve({ title, artist, album, genre, artworkUrl, lyrics, replayGain });
        },
        onError: async () => {
          const sidecarLyrics = await checkSidecarLyrics(fileUri);
          resolve({
            title: null,
            artist: null,
            album: null,
            genre: null,
            artworkUrl: null,
            lyrics: sidecarLyrics,
            replayGain: null,
          });
        },
      });
    });
  } catch (e) {
    console.warn('[MetadataExtractor] Error al leer metadatos de:', fileUri, e);
    const sidecarLyrics = await checkSidecarLyrics(fileUri);
    return {
      title: null,
      artist: null,
      album: null,
      genre: null,
      artworkUrl: null,
      lyrics: sidecarLyrics,
      replayGain: null,
    };
  }
};
