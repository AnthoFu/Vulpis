import { useState, useEffect, useCallback } from 'react';
import webPlayer from '../services/webAudioPlayer';

export default function useWebPlayer() {
  const [state, setState] = useState(() => webPlayer.getState());

  useEffect(() => {
    const unsubscribe = webPlayer.subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const playTrack = useCallback((track, queue) => {
    webPlayer.playTrack(track, queue);
  }, []);

  const togglePlay = useCallback(() => {
    webPlayer.togglePlay();
  }, []);

  const seek = useCallback((seconds) => {
    webPlayer.seek(seconds);
  }, []);

  const setVolume = useCallback((vol) => {
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

  const addToQueue = useCallback((track) => {
    webPlayer.addToQueue(track);
  }, []);

  const removeFromQueue = useCallback((index) => {
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
