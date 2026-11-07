import TrackPlayer, { Event, type BackgroundEvent } from '@rntp/player';

/**
 * Servicio de eventos en segundo plano para Android (Headless JS).
 * Se encarga de procesar comandos de notificación/pantalla de bloqueo cuando la UI está minimizada.
 */
export default async function playbackService(event: BackgroundEvent): Promise<void> {
  if (event.type === Event.RemotePlay) {
    await TrackPlayer.play();
  } else if (event.type === Event.RemotePause) {
    await TrackPlayer.pause();
  } else if (event.type === Event.RemoteStop) {
    await TrackPlayer.destroy();
  } else if (event.type === Event.RemoteNext) {
    await TrackPlayer.skipToNext();
  } else if (event.type === Event.RemotePrevious) {
    await TrackPlayer.skipToPrevious();
  } else if (event.type === Event.RemoteSeek) {
    await TrackPlayer.seekTo(event.position);
  }
}
