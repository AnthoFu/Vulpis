import { saveArtworkToCache } from './artwork';
import { parseGainDb, parsePeak, parseITunNorm } from './replayGain';

export const ID3_GENRES = [
  'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop',
  'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock',
  'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack',
  'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance',
  'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise',
  'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop',
  'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic',
  'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta', 'Top 40',
  'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave',
  'Psychadelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk',
  'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock', 'Folk', 'Folk-Rock',
  'National Folk', 'Swing', 'Fast Fusion', 'Bebob', 'Latin', 'Revival', 'Celtic', 'Bluegrass',
  'Avantgarde', 'Gothic Rock', 'Progressive Rock', 'Psychedelic Rock', 'Symphonic Rock', 'Slow Rock',
  'Big Band', 'Chorus', 'Easy Listening', 'Acoustic', 'Humour', 'Speech', 'Chanson', 'Opera',
  'Chamber Music', 'Sonata', 'Symphony', 'Booty Bass', 'Primus', 'Porn Groove', 'Satire',
  'Slow Jam', 'Club', 'Tango', 'Samba', 'Folklore', 'Ballad', 'Power Ballad', 'Rhythmic Soul',
  'Freestyle', 'Duet', 'Punk Rock', 'Drum Solo', 'Acapella', 'Euro-House', 'Dance Hall',
];

/**
 * Normaliza y decodifica géneros musicales a partir de códigos ID3 numéricos o texto libre.
 */
export function cleanGenreString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Si viene como "(17)" o "(17)Rock"
  const match = trimmed.match(/^\((\d+)\)(.*)$/);
  if (match) {
    const code = parseInt(match[1], 10);
    const remainder = match[2].trim();
    if (remainder) return remainder;
    if (code >= 0 && code < ID3_GENRES.length) return ID3_GENRES[code];
  }

  // Si viene solo como número "17"
  if (/^\d+$/.test(trimmed)) {
    const code = parseInt(trimmed, 10);
    if (code >= 0 && code < ID3_GENRES.length) return ID3_GENRES[code];
  }

  // Quitar caracteres nulos o terminadores
  const cleaned = trimmed.replace(/\0/g, '').trim();
  return cleaned || null;
}

/**
 * Decodifica una secuencia de bytes en string de acuerdo con el encoding ID3 (ISO-8859-1, UTF-16, UTF-8).
 */
export function decodeText(bytes, encoding) {
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
 * Parser nativo ultra-rápido para ID3v2 (v2.2, v2.3, v2.4).
 * Ejecuta en ~0.2ms sin carga de librerías ni clones pesados de memoria.
 */
export async function parseFastID3(bytes, fileUri) {
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
    album: null,
    genre: null,
    artworkUrl: null,
    lyrics: null,
    replayGain: {
      trackGain: null,
      trackPeak: null,
      albumGain: null,
      albumPeak: null,
    },
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
    // Álbum
    else if ((frameId === 'TALB' || frameId === 'TAL') && !result.album) {
      result.album = decodeText(bytes.subarray(dataStart + 1, dataStart + frameSize), encoding);
    }
    // Género
    else if ((frameId === 'TCON' || frameId === 'TCO') && !result.genre) {
      const rawGenre = decodeText(bytes.subarray(dataStart + 1, dataStart + frameSize), encoding);
      result.genre = cleanGenreString(rawGenre);
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
    // Etiquetas de texto definidas por el usuario (TXXX / TXX) para ReplayGain
    else if (frameId === 'TXXX' || frameId === 'TXX') {
      try {
        let pos = dataStart + 1; // saltar encoding
        let desc = '';
        let val = '';
        if (encoding === 1 || encoding === 2) {
          let descEnd = pos;
          while (descEnd + 1 < dataStart + frameSize) {
            if (bytes[descEnd] === 0 && bytes[descEnd + 1] === 0) {
              break;
            }
            descEnd += 2;
          }
          desc = decodeText(bytes.subarray(pos, descEnd), encoding).trim();
          const valStart = Math.min(descEnd + 2, dataStart + frameSize);
          val = decodeText(bytes.subarray(valStart, dataStart + frameSize), encoding).trim();
        } else {
          let descEnd = pos;
          while (descEnd < dataStart + frameSize && bytes[descEnd] !== 0) {
            descEnd++;
          }
          desc = decodeText(bytes.subarray(pos, descEnd), encoding).trim();
          const valStart = Math.min(descEnd + 1, dataStart + frameSize);
          val = decodeText(bytes.subarray(valStart, dataStart + frameSize), encoding).trim();
        }

        if (desc && val) {
          const descLower = desc.toLowerCase();
          if (descLower === 'replaygain_track_gain' || descLower === 'replaygain_gain' || descLower === 'rg_track_gain') {
            const g = parseGainDb(val);
            if (g !== null) result.replayGain.trackGain = g;
          } else if (descLower === 'replaygain_track_peak' || descLower === 'rg_track_peak') {
            const p = parsePeak(val);
            if (p !== null) result.replayGain.trackPeak = p;
          } else if (descLower === 'replaygain_album_gain' || descLower === 'rg_album_gain') {
            const g = parseGainDb(val);
            if (g !== null) result.replayGain.albumGain = g;
          } else if (descLower === 'replaygain_album_peak' || descLower === 'rg_album_peak') {
            const p = parsePeak(val);
            if (p !== null) result.replayGain.albumPeak = p;
          } else if (descLower === 'itunnorm' || descLower.includes('itunnorm')) {
            const norm = parseITunNorm(val);
            if (norm) {
              if (result.replayGain.trackGain === null) result.replayGain.trackGain = norm.gain;
              if (result.replayGain.trackPeak === null && norm.peak !== null) result.replayGain.trackPeak = norm.peak;
            }
          }
        }
      } catch (txxxErr) {
        // Ignorar error en frame TXXX
      }
    }
    // Comentarios ID3 (COMM / COM) con posible SoundCheck / iTunNORM
    else if (frameId === 'COMM' || frameId === 'COM') {
      try {
        let pos = dataStart + 4; // saltar encoding (1) y lenguaje (3)
        let desc = '';
        let val = '';
        if (encoding === 1 || encoding === 2) {
          let descEnd = pos;
          while (descEnd + 1 < dataStart + frameSize) {
            if (bytes[descEnd] === 0 && bytes[descEnd + 1] === 0) {
              break;
            }
            descEnd += 2;
          }
          desc = decodeText(bytes.subarray(pos, descEnd), encoding).trim();
          const valStart = Math.min(descEnd + 2, dataStart + frameSize);
          val = decodeText(bytes.subarray(valStart, dataStart + frameSize), encoding).trim();
        } else {
          let descEnd = pos;
          while (descEnd < dataStart + frameSize && bytes[descEnd] !== 0) {
            descEnd++;
          }
          desc = decodeText(bytes.subarray(pos, descEnd), encoding).trim();
          const valStart = Math.min(descEnd + 1, dataStart + frameSize);
          val = decodeText(bytes.subarray(valStart, dataStart + frameSize), encoding).trim();
        }

        if ((desc && desc.toLowerCase().includes('itunnorm')) || (val && val.includes(' 00000'))) {
          const norm = parseITunNorm(val);
          if (norm) {
            if (result.replayGain.trackGain === null) result.replayGain.trackGain = norm.gain;
            if (result.replayGain.trackPeak === null && norm.peak !== null) result.replayGain.trackPeak = norm.peak;
          }
        }
      } catch (commErr) {
        // Ignorar error en frame COMM
      }
    }
    // Ajuste de volumen relativo ID3 (RVA2)
    else if (frameId === 'RVA2') {
      try {
        let pos = dataStart;
        while (pos < dataStart + frameSize && bytes[pos] !== 0) {
          pos++;
        }
        pos++; // saltar null
        if (pos + 3 <= dataStart + frameSize) {
          const rawGain = (bytes[pos + 1] << 8) | bytes[pos + 2];
          const signedGain = (rawGain & 0x8000) ? (rawGain - 0x10000) : rawGain;
          const gainDb = signedGain / 512.0;
          if (result.replayGain.trackGain === null) {
            result.replayGain.trackGain = gainDb;
          }
        }
      } catch (rvaErr) {
        // Ignorar error en frame RVA2
      }
    }

    offset += headerSize + frameSize;
  }

  const hasReplayGain =
    result.replayGain.trackGain !== null ||
    result.replayGain.trackPeak !== null ||
    result.replayGain.albumGain !== null ||
    result.replayGain.albumPeak !== null;
  if (!hasReplayGain) {
    result.replayGain = null;
  }

  return result;
}
