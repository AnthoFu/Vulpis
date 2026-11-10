/**
 * Definiciones de tipos e interfaces para la versión Web de Vulpis.
 */

import { EqualizerSettings } from '../models/EqualizerSettings';

export interface WebTrack {
  id: string;
  mediaId: string;
  driveFileId?: string;
  title: string;
  artist: string;
  album: string;
  artwork?: string | null;
  size?: string;
  source: string;
  index?: number;
  url?: string;
  duration?: number;
}

export interface WebLrcLine {
  time: number | null;
  text: string;
  isBreak: boolean;
}

export interface WebLyricsData {
  synced: string | null;
  plain: string | null;
  parsed: WebLrcLine[] | null;
}

export type WebRepeatMode = 'off' | 'track' | 'queue';

export interface WebPlayerState {
  currentTrack: WebTrack | null;
  queue: WebTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: WebRepeatMode;
  equalizerSettings: EqualizerSettings;
}

export interface WebGoogleConfig {
  clientId: string;
}

export interface WebDriveFile {
  id: string;
  name: string;
  size?: string;
  webContentLink?: string;
  createdTime?: string;
}
