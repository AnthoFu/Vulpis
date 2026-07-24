import { Image } from 'react-native';

const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;

export const localTracks = [
  {
    mediaId: 'local-1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Acoustic Sunrise',
    artist: 'Local Artist (Device)',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'local-2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Garage Jam Session',
    artist: 'The Local Band',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'local-3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Rainy Day Demo',
    artist: 'Myself',
    artworkUrl: defaultCover,
  },
];

export const privateTracks = [];

// Respaldo para compatibilidad con la base de código existente
export const trackQueue = localTracks;
