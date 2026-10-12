import TrackPlayer from '@rntp/player';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CROSSFADE_SETTINGS_KEY = 'vulpis_crossfade_settings';

export const DEFAULT_CROSSFADE_SETTINGS = {
  enabled: false,
  duration: 4, // Duración en segundos (2s, 4s, 6s, 8s, 10s, 12s)
};

let currentFadeTimer = null;
let isAutoFading = false;
let lastFadedTrackId = null;
let currentVol = 1.0;
let activeBaselineVol = 1.0;

/**
 * Establece el volumen base de la pista activa (calculado por ReplayGain).
 */
export function setActiveBaselineVolume(vol) {
  const safeVol = Math.max(0, Math.min(1, typeof vol === 'number' && !isNaN(vol) ? vol : 1.0));
  activeBaselineVol = safeVol;
  if (!isAutoFading && !currentFadeTimer) {
    currentVol = safeVol;
    TrackPlayer.setVolume(safeVol);
  }
}

/**
 * Obtiene el volumen base activo actual.
 */
export function getActiveBaselineVolume() {
  return activeBaselineVol;
}

/**
 * Obtiene la configuración de fundido cruzado guardada.
 */
export async function getCrossfadeSettings() {
  try {
    const raw = await AsyncStorage.getItem(CROSSFADE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_CROSSFADE_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('[Crossfade] Error al leer ajustes de fundido:', e);
  }
  return DEFAULT_CROSSFADE_SETTINGS;
}

/**
 * Guarda la configuración de fundido cruzado en AsyncStorage.
 */
export async function saveCrossfadeSettings(settings) {
  try {
    await AsyncStorage.setItem(CROSSFADE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Crossfade] Error al guardar ajustes de fundido:', e);
  }
}

/**
 * Interpola suavemente el volumen del reproductor hacia targetVolume en durationMs milisegundos.
 */
export function fadeVolume(targetVolume, durationMs = 300) {
  return new Promise((resolve) => {
    if (currentFadeTimer) {
      clearInterval(currentFadeTimer);
      currentFadeTimer = null;
    }

    const startVol = currentVol;
    const endVol = Math.max(0, Math.min(1, typeof targetVolume === 'number' ? targetVolume : activeBaselineVol));

    if (durationMs <= 0 || Math.abs(startVol - endVol) < 0.02) {
      currentVol = endVol;
      TrackPlayer.setVolume(endVol);
      resolve();
      return;
    }

    const stepIntervalMs = 25;
    const totalSteps = Math.max(1, Math.round(durationMs / stepIntervalMs));
    let currentStep = 0;

    currentFadeTimer = setInterval(() => {
      currentStep++;
      const progress = Math.min(1, currentStep / totalSteps);
      
      // Curva de coseno para una atenuación y aumento acústicamente natural (Equal-Power curve)
      const curve = (1 - Math.cos(progress * Math.PI)) / 2;
      const newVol = startVol + (endVol - startVol) * curve;

      currentVol = newVol;
      TrackPlayer.setVolume(newVol);

      if (currentStep >= totalSteps) {
        clearInterval(currentFadeTimer);
        currentFadeTimer = null;
        currentVol = endVol;
        TrackPlayer.setVolume(endVol);
        resolve();
      }
    }, stepIntervalMs);
  });
}

/**
 * Desvanece el volumen a 0.
 */
export function fadeOut(durationMs = 250) {
  return fadeVolume(0.0, durationMs);
}

/**
 * Aumenta el volumen a targetVolume (por defecto activeBaselineVol).
 */
export function fadeIn(durationMs = 250, targetVolume = null) {
  const target = typeof targetVolume === 'number' ? targetVolume : activeBaselineVol;
  return fadeVolume(target, durationMs);
}

/**
 * Restablece el volumen a activeBaselineVol inmediatamente si no hay un fundido en curso.
 */
export function resetVolumeToNormal() {
  if (currentFadeTimer) {
    clearInterval(currentFadeTimer);
    currentFadeTimer = null;
  }
  currentVol = activeBaselineVol;
  TrackPlayer.setVolume(activeBaselineVol);
}

/**
 * Envuelve una acción de cambio de pista con una transición suave de volumen.
 */
export async function smoothTrackTransition(actionFn, isEnabled = true, transitionMs = 250) {
  if (!isEnabled) {
    const result = await actionFn();
    resetVolumeToNormal();
    return result;
  }

  try {
    await fadeOut(transitionMs);
  } catch (e) {
    console.log('[Crossfade] Error en fadeOut de transición:', e);
  }

  let result;
  try {
    result = await actionFn();
  } catch (err) {
    console.error('[Crossfade] Error ejecutando acción durante transición:', err);
  }

  try {
    await fadeIn(transitionMs, activeBaselineVol);
  } catch (e) {
    console.log('[Crossfade] Error en fadeIn de transición:', e);
  }

  return result;
}

/**
 * Monitoreo de final de pista para fundido cruzado automático entre canciones.
 * Se invoca en cada tick de progreso del reproductor.
 */
export function handleAutoCrossfadeProgress({
  position,
  duration,
  isPlaying,
  crossfadeEnabled,
  crossfadeDuration = 4,
  activeTrackId,
}) {
  if (!crossfadeEnabled || !isPlaying || duration <= 0) {
    if (isAutoFading) {
      isAutoFading = false;
      resetVolumeToNormal();
    }
    return;
  }

  // Si la pista activa cambió respecto a la última que estaba finalizando, hacer fundido de entrada
  if (activeTrackId && activeTrackId !== lastFadedTrackId) {
    if (isAutoFading) {
      isAutoFading = false;
      const fadeInDuration = Math.min(2000, crossfadeDuration * 400);
      fadeIn(fadeInDuration, activeBaselineVol);
    }
    lastFadedTrackId = activeTrackId;
  }

  const remaining = duration - position;
  const fadeDuration = Math.max(1, crossfadeDuration);

  // La pista debe durar al menos el doble del tiempo de fundido para evitar desvanecer canciones ultracortas
  if (duration > fadeDuration * 2 && remaining > 0 && remaining <= fadeDuration) {
    if (!currentFadeTimer) {
      isAutoFading = true;
      const progressRatio = remaining / fadeDuration; // De 1.0 a 0.0
      const curve = (1 - Math.cos(progressRatio * Math.PI)) / 2;
      const targetVol = Math.max(0.02, activeBaselineVol * curve);
      currentVol = targetVol;
      TrackPlayer.setVolume(targetVol);
    }
  } else if (!isAutoFading && !currentFadeTimer && Math.abs(currentVol - activeBaselineVol) > 0.02) {
    // Si no está en zona de fundido ni en animación, asegurarse de que el volumen esté en su línea base
    currentVol = activeBaselineVol;
    TrackPlayer.setVolume(activeBaselineVol);
  }
}
