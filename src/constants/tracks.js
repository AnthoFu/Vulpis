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

export const privateTracks = [
  {
    mediaId: 'private-1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    title: 'Studio Mix v4.2',
    artist: 'Private Upload (NAS Cloud)',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'private-2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    title: 'Unreleased Instrumental',
    artist: 'Collaborator X',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'private-3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    title: 'Live Backup 2025',
    artist: 'Vulpis Session',
    artworkUrl: defaultCover,
  },
];

export const publicTracks = [
  {
    mediaId: 'public-1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    title: 'Midnight Horizon (Global)',
    artist: 'Lofi Dreamer',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'public-2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    title: 'Neon Dreams (Worldwide)',
    artist: 'Retro Synth',
    artworkUrl: defaultCover,
  },
  {
    mediaId: 'public-3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    title: 'Vulpis Groove (Hit Single)',
    artist: 'Funk Master',
    artworkUrl: defaultCover,
  },
];

// Fallback for existing codebase compatibility
export const trackQueue = localTracks;
