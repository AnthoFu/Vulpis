/**
 * Servicio de sincronización para el AppWidget de Android de Vulpis.
 * Conecta el estado de reproducción de React Native con el widget de la pantalla de inicio
 * y escucha acciones táctiles enviadas desde los botones del widget.
 */

import { NativeModules, DeviceEventEmitter, Platform, EmitterSubscription } from 'react-native';
import { Track } from '../../models/Track';

const { VulpisWidget } = NativeModules;

export interface WidgetCallbacks {
  onPlayPause?: () => void | Promise<void>;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void | Promise<void>;
}

/**
 * Actualiza el título, artista, carátula y estado de reproducción en todos los widgets de Android.
 *
 * @param track Pista activa actual o null si no hay reproducción
 * @param isPlaying Estado de reproducción (reproduciendo o pausado)
 */
export function updateWidgetState(track?: Track | null, isPlaying: boolean = false): void {
  if (Platform.OS !== 'android' || !VulpisWidget) return;

  try {
    if (!track) {
      VulpisWidget.updateWidget(null, false);
      return;
    }

    const payload = {
      title: track.title || 'Vulpis Music',
      artist: track.artist || 'Artista desconocido',
      album: track.album || '',
      artworkUrl: track.artworkUrl || null,
    };

    VulpisWidget.updateWidget(payload, isPlaying);
  } catch (err) {
    console.warn('[WidgetService] Error al actualizar estado del widget:', err);
  }
}

/**
 * Comprueba de forma asíncrona si hay widgets de Vulpis activos en la pantalla de inicio.
 */
export async function isWidgetActive(): Promise<boolean> {
  if (Platform.OS !== 'android' || !VulpisWidget || !VulpisWidget.isWidgetActive) {
    return false;
  }

  try {
    return await VulpisWidget.isWidgetActive();
  } catch {
    return false;
  }
}

/**
 * Registra los escuchadores para procesar comandos táctiles enviados desde el widget de Android.
 *
 * @param callbacks Manejadores de reproducción (Play/Pausa, Siguiente, Anterior)
 * @returns Función para cancelar la suscripción
 */
export function setupWidgetListener(callbacks: WidgetCallbacks): () => void {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  const subscription: EmitterSubscription = DeviceEventEmitter.addListener(
    'onWidgetAction',
    (action: string) => {
      console.log(`[WidgetService] Acción recibida desde AppWidget: ${action}`);
      if (action === 'play_pause' && callbacks.onPlayPause) {
        callbacks.onPlayPause();
      } else if (action === 'next' && callbacks.onNext) {
        callbacks.onNext();
      } else if (action === 'prev' && callbacks.onPrevious) {
        callbacks.onPrevious();
      }
    }
  );

  return () => {
    subscription.remove();
  };
}
