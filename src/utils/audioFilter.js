/**
 * Módulo de filtrado inteligente de archivos de audio para Vulpis Player.
 * Excluye notas de voz, audios de mensajería (WhatsApp, Telegram, etc.),
 * grabadoras de llamadas/voz, tonos de notificación y sonidos del sistema.
 */

// Extensiones válidas para archivos de música
const VALID_AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|flac|aac|ogg|opus)$/i;

// Duración mínima en segundos para considerar un audio como canción (15 segundos)
const MIN_TRACK_DURATION_SECONDS = 15;

// Patrones de nombres de archivo típicos de mensajería, grabadoras y notas de voz
const EXCLUDED_FILENAME_PATTERNS = [
  // WhatsApp: AUD-20240101-WA0001, PTT-20240101-WA0001, WA0001...
  /^(aud|ptt)-\d{8}-wa\d+/i,
  /^wa\d{4,}/i,
  // Telegram: audio_2024-01-01..., voice_2024-01-01...
  /^(audio|voice)[_-]\d+/i,
  // Facebook Messenger / Instagram audio clips
  /^audioclip[_-]\d+/i,
  // Grabadoras de voz y llamadas (REC_2024..., Call_2024..., Voice001...)
  /^(call|call_rec|callrecord|call_recording)[_-]?\d+/i,
  /^(rec|recording|record)[_-]?\d+/i,
  /^(voice|voicenote|audiorecord|grabacion|llamada)[_-]?\d+/i,
  /^(voice|recording|grabacion|llamada)\s+\d+/i,
];

// Palabras clave estrictas en rutas de aplicaciones de mensajería y redes sociales
const STRICT_APP_FOLDER_KEYWORDS = [
  'whatsapp',
  'com.whatsapp',
  'w4b', // WhatsApp Business
  'telegram',
  'org.telegram.messenger',
  'com.facebook.orca',
  'messenger',
  'instagram',
  'viber',
  'org.thoughtcrime.securesms', // Signal
  'discord',
  'micromsg', // WeChat
  'line.android',
  'snapchat',
  'com.slack',
  'skype',
  'tiktok',
];

// Rutas de grabadoras, sistema, tonos y cachés
const GENERAL_EXCLUDED_PATH_KEYWORDS = [
  // Grabadoras y llamadas
  'sound_recorder',
  'voicenote',
  'voicenotes',
  'voice recorder',
  'voicerecorder',
  'call_rec',
  'callrecording',
  'callrecordings',
  'callrecorder',
  'phonerecord',
  'grabadora',
  'grabaciones',
  'notas de voz',
  // Tonos y sistema
  '/notifications/',
  '/ringtones/',
  '/alarms/',
  '/system/media/',
  '/ui/',
  // Cachés y almacenamiento interno privado de apps
  '/android/data/',
  '/.cache/',
  '/cache/',
  '/.thumbnails/',
  '/.trash/',
];

/**
 * Determina si un recurso o pista de audio debe ser excluido de la biblioteca musical.
 *
 * @param {object} item - Asset de MediaLibrary o Track del reproductor.
 * @returns {boolean} true si el audio debe ser excluido, false si es una canción válida.
 */
export function isExcludedAudio(item) {
  if (!item) return true;

  // 1. Conservar siempre pistas importadas explícitamente por el usuario o descargadas de Drive
  if (
    item.mediaId &&
    (item.mediaId.startsWith('imported-') || item.mediaId.startsWith('local-drive-'))
  ) {
    return false;
  }

  const uri = item.uri || item.url || '';
  const filename = item.filename || (uri ? uri.split('/').pop() : '') || item.title || '';
  const duration = typeof item.duration === 'number' ? item.duration : 0;

  // 2. Comprobar extensiones de archivo compatibles
  const targetName = filename || uri;
  if (!VALID_AUDIO_EXTENSIONS.test(targetName)) {
    return true;
  }

  // 3. Duración mínima: si la duración está registrada y es menor a 15s, es un clip o efecto
  if (duration > 0 && duration < MIN_TRACK_DURATION_SECONDS) {
    return true;
  }

  // Decodificar URI para interpretar espacios codificados (%20)
  let decodedUri = '';
  try {
    decodedUri = decodeURIComponent(uri).toLowerCase();
  } catch (e) {
    decodedUri = uri.toLowerCase();
  }
  const cleanFilename = filename.toLowerCase();

  // Comprobar si el archivo reside explícitamente en una carpeta de música
  const isInMusicFolder =
    decodedUri.includes('/music/') ||
    decodedUri.includes('/musica/') ||
    decodedUri.includes('/música/');

  // 4. Tratamiento de formato .opus:
  // En dispositivos móviles casi la totalidad de archivos .opus son notas de voz de WhatsApp o Telegram.
  // Solo se permiten si se encuentran explícitamente en una carpeta /Music/ o /Musica/
  if (cleanFilename.endsWith('.opus') && !isInMusicFolder) {
    return true;
  }

  // 5. Exclusión por patrones característicos de nombre de archivo (WhatsApp, Telegram, grabadoras)
  for (const pattern of EXCLUDED_FILENAME_PATTERNS) {
    if (pattern.test(cleanFilename)) {
      return true;
    }
  }

  // 6. Exclusión de rutas de apps de mensajería (WhatsApp, Telegram, Messenger, etc.)
  for (const kw of STRICT_APP_FOLDER_KEYWORDS) {
    if (decodedUri.includes(kw)) {
      return true;
    }
  }

  // 7. Si no está en una carpeta de música, verificar carpetas de grabadoras, sistema y cachés
  if (!isInMusicFolder) {
    for (const kw of GENERAL_EXCLUDED_PATH_KEYWORDS) {
      if (decodedUri.includes(kw)) {
        return true;
      }
    }

    // Descartar si se encuentra dentro de una carpeta oculta (ej: /.nomedia/, /.secret/)
    if (/\/\.[^/]+\//.test(decodedUri)) {
      return true;
    }
  }

  return false;
}

/**
 * Filtra una lista de assets o canciones conservando únicamente las pistas musicales válidas.
 *
 * @param {Array} list - Lista de assets o pistas.
 * @returns {Array} Lista filtrada sin audios de mensajería ni grabaciones.
 */
export function filterMusicAssets(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.filter((item) => !isExcludedAudio(item));
}
