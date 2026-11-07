import { registerRootComponent } from 'expo';
import TrackPlayer, { Event } from '@rntp/player';

import App from './App';
import playbackService from './service';

// Registrar eventos de controles remotos para iOS y primer plano en Android
TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App);
// También asegura que ya sea que cargues la app en Expo Go o en una compilación nativa,
// el entorno esté configurado adecuadamente.
registerRootComponent(App);

// Manejador en segundo plano para Android (Headless JS)
TrackPlayer.registerBackgroundEventHandler(() => playbackService);
