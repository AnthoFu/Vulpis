import { useState, useEffect, useCallback } from 'react';
import webPlayer from '../services/webAudioPlayer';
import { WebTrack, WebPlayerState } from '../types';

export interface UseWebPlayerReturn extends WebPlayerState {
  playTrack: (track: WebTrack, queue?: WebTrack[] | null) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: WebTrack) => void;
  removeFromQueue: (index: number) => void;
}

export default function useWebPlayer(): UseWebPlayerReturn {
  const [state, setState] = useState<WebPlayerState>(() => webPlayer.getState());

  useEffect(() => {
    const unsubscribe = webPlayer.subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const playTrack = useCallback((track: WebTrack, queue?: WebTrack[] | null) => {
    webPlayer.playTrack(track, queue ?? null);
  }, []);

  const togglePlay = useCallback(() => {
    webPlayer.togglePlay();
  }, []);

  const seek = useCallback((seconds: number) => {
    webPlayer.seek(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    webPlayer.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    webPlayer.toggleMute();
  }, []);

  const next = useCallback(() => {
    webPlayer.next();
  }, []);

  const previous = useCallback(() => {
    webPlayer.previous();
  }, []);

  const toggleShuffle = useCallback(() => {
    webPlayer.toggleShuffle();
  }, []);

  const toggleRepeat = useCallback(() => {
    webPlayer.toggleRepeat();
  }, []);

  const addToQueue = useCallback((track: WebTrack) => {
    webPlayer.addToQueue(track);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    webPlayer.removeFromQueue(index);
  }, []);

  return {
    ...state,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    removeFromQueue,
  };
}
