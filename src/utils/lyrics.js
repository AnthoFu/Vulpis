import * as FileSystem from 'expo-file-system/legacy';

/**
 * Limpia y normaliza el texto de las letras eliminando marcas de tiempo LRC y etiquetas de metadatos.
 */
export function formatLyricsText(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== 'string') return '';
  return rawLyrics
    .split('\n')
    .filter((line) => !/^\[(ar|ti|al|by|offset|length|re|ve):.*\]$/i.test(line.trim()))
    .map((line) => line.replace(/\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/g, '').trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join('\n')
    .trim();
}

/**
 * Parsea letras sincrónicas en formato .lrc devolviendo un arreglo de objetos { time, text, isBreak }.
 * Soporta etiquetas [offset: +/-ms], descarta metadatos y detecta pausas instrumentales.
 */
export function parseLrcLyrics(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== 'string') return [];
  const lines = rawLyrics.split('\n');
  const result = [];
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const metaRegex = /^\[(ar|ti|al|by|length|re|ve):.*\]$/i;

  let globalOffset = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const offsetMatch = trimmed.match(/^\[offset:\s*([+-]?\d+)\s*\]$/i);
    if (offsetMatch) {
      globalOffset = (parseInt(offsetMatch[1], 10) || 0) / 1000;
      break;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || metaRegex.test(trimmed) || /^\[offset:.*\]$/i.test(trimmed)) {
      continue;
    }

    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();

    if (matches.length > 0) {
      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
        let timeInSeconds = min * 60 + sec + ms / 1000;
        if (globalOffset !== 0) {
          timeInSeconds = Math.max(0, timeInSeconds + globalOffset);
        }
        if (text) {
          result.push({ time: timeInSeconds, text, isBreak: false });
        } else {
          result.push({ time: timeInSeconds, text: '♪  ♪  ♪', isBreak: true });
        }
      }
    } else if (trimmed) {
      result.push({ time: null, text: trimmed, isBreak: false });
    }
  }

  result.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });

  // Eliminar pausas/breaks redundantes consecutivos
  const cleanResult = [];
  for (let i = 0; i < result.length; i++) {
    const curr = result[i];
    const prev = cleanResult[cleanResult.length - 1];
    if (curr.isBreak && prev && prev.isBreak) {
      continue;
    }
    cleanResult.push(curr);
  }
  return cleanResult;
}

/**
 * Extrae las letras embebidas en las etiquetas leídas por jsmediatags (USLT, lyrics, unsynchronisedLyrics).
 */
export function getLyricsFromTags(tags) {
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

/**
 * Busca archivos sidecar de letras (.lrc o .txt) en la misma ruta del archivo de audio.
 */
export async function checkSidecarLyrics(fileUri) {
  try {
    if (
      !fileUri ||
      typeof fileUri !== 'string' ||
      (!fileUri.startsWith('file://') && !fileUri.startsWith('/'))
    ) {
      return null;
    }
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
}
