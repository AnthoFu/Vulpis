import { registerRootComponent } from 'expo';
import TrackPlayer from '@rntp/player';

import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App);
// También asegura que ya sea que cargues la app en Expo Go o en una compilación nativa,
// el entorno esté configurado adecuadamente
registerRootComponent(App);
TrackPlayer.registerBackgroundEventHandler(() => require('./service').default);

