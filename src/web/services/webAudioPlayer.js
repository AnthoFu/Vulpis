/**
 * Motor de Audio para la versión Web de Vulpis.
 * Envuelve el elemento HTML5 <audio> con gestión completa de cola,
 * shuffle, repeat, buffering y notificaciones de estado.
 */

class WebAudioPlayer {
  constructor() {
    this.audio = typeof Audio !== 'undefined' ? new Audio() : null;
    this.queue = [];
    this.originalQueue = [];
    this.currentIndex = -1;
    this.currentTrack = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 1;
    this.isMuted = false;
    this.isShuffle = false;
    this.repeatMode = 'off'; // 'off' | 'track' | 'queue'
    this.listeners = new Set();
    this.driveTokenGetter = null;

    if (this.audio) {
      this._setupAudioListeners();
    }
  }

  setDriveTokenGetter(fn) {
    this.driveTokenGetter = fn;
  }

  _setupAudioListeners() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this._notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this._notify();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime || 0;
      this.duration = this.audio.duration || this.duration || 0;
      this._notify();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration || 0;
      this.isLoading = false;
      this._notify();
    });

    this.audio.addEventListener('waiting', () => {
      this.isLoading = true;
      this._notify();
    });

    this.audio.addEventListener('canplay', () => {
      this.isLoading = false;
      this._notify();
    });

    this.audio.addEventListener('ended', () => {
      this._handleTrackEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('[WebAudioPlayer] Error en reproducción de audio:', e);
      this.isPlaying = false;
      this.isLoading = false;
      this._notify();
    });
  }

  _handleTrackEnded() {
    if (this.repeatMode === 'track') {
      this.audio.currentTime = 0;
      this.audio.play().catch(console.warn);
      return;
    }

    if (this.currentIndex < this.queue.length - 1) {
      this.next();
    } else if (this.repeatMode === 'queue' && this.queue.length > 0) {
      this.playIndex(0);
    } else {
      this.isPlaying = false;
      this.currentTime = 0;
      this._notify();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  _notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[WebAudioPlayer] Error en listener:', err);
      }
    });
  }

  getState() {
    return {
      currentTrack: this.currentTrack,
      queue: this.queue,
      currentIndex: this.currentIndex,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
    };
  }

  async playTrack(track, newQueue = null) {
    if (newQueue) {
      this.originalQueue = [...newQueue];
      this.queue = this.isShuffle ? this._shuffleArray([...newQueue]) : [...newQueue];
      this.currentIndex = this.queue.findIndex((t) => t.id === track.id);
      if (this.currentIndex === -1) {
        this.queue.unshift(track);
        this.currentIndex = 0;
      }
    }

    this.currentTrack = track;
    this.isLoading = true;
    this.currentTime = 0;
    this._notify();

    try {
      let audioUrl = track.url;

      // Si es una pista de Google Drive que no tiene Blob URL resuelta
      if (!audioUrl && track.driveFileId) {
        const token = this.driveTokenGetter ? this.driveTokenGetter() : null;
        if (token) {
          const { getWebAudioBlobUrl, extractMetadataFromBlob } = await import('./webDrive');
          const res = await getWebAudioBlobUrl(track.driveFileId, token);
          audioUrl = res.objectUrl;
          track.url = audioUrl;

          // Extraer metadatos ID3 en segundo plano si aún no los tiene
          if (!track.artwork && res.blob) {
            extractMetadataFromBlob(res.blob, track.title).then((meta) => {
              if (meta.artwork) {
                track.artwork = meta.artwork;
                this._notify();
              }
            });
          }
        }
      }

      if (!audioUrl) {
        throw new Error('No se pudo resolver la URL de reproducción para la pista.');
      }

      this.audio.src = audioUrl;
      this.audio.load();
      await this.audio.play();
    } catch (err) {
      console.error('[WebAudioPlayer] Error al cargar o reproducir:', err);
      this.isLoading = false;
      this.isPlaying = false;
      this._notify();
    }
  }

  async playIndex(index) {
    if (index >= 0 && index < this.queue.length) {
      this.currentIndex = index;
      await this.playTrack(this.queue[index]);
    }
  }

  togglePlay() {
    if (!this.audio || !this.currentTrack) return;
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(console.warn);
    }
  }

  seek(seconds) {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(seconds, this.duration || seconds));
    this.audio.currentTime = clamped;
    this.currentTime = clamped;
    this._notify();
  }

  setVolume(vol) {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    this.audio.volume = clamped;
    this.isMuted = clamped === 0;
    this._notify();
  }

  toggleMute() {
    if (!this.audio) return;
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    this._notify();
  }

  next() {
    if (this.queue.length === 0) return;
    if (this.currentIndex < this.queue.length - 1) {
      this.playIndex(this.currentIndex + 1);
    } else if (this.repeatMode === 'queue') {
      this.playIndex(0);
    }
  }

  previous() {
    if (!this.audio) return;
    // Si ya pasaron más de 3 segundos, reiniciar la pista actual
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    if (this.currentIndex > 0) {
      this.playIndex(this.currentIndex - 1);
    } else {
      this.seek(0);
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle) {
      const current = this.currentTrack;
      const otherTracks = this.originalQueue.filter((t) => t.id !== current?.id);
      this.queue = current ? [current, ...this._shuffleArray(otherTracks)] : this._shuffleArray([...this.originalQueue]);
      this.currentIndex = 0;
    } else {
      const current = this.currentTrack;
      this.queue = [...this.originalQueue];
      this.currentIndex = this.queue.findIndex((t) => t.id === current?.id);
    }
    this._notify();
  }

  toggleRepeat() {
    const modes = ['off', 'queue', 'track'];
    const nextIdx = (modes.indexOf(this.repeatMode) + 1) % modes.length;
    this.repeatMode = modes[nextIdx];
    this._notify();
  }

  addToQueue(track) {
    this.queue.push(track);
    this.originalQueue.push(track);
    this._notify();
  }

  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      const removed = this.queue.splice(index, 1)[0];
      this.originalQueue = this.originalQueue.filter((t) => t.id !== removed.id);
      if (index < this.currentIndex) {
        this.currentIndex--;
      }
      this._notify();
    }
  }

  _shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

// Instancia única (Singleton) para toda la versión web
export const webPlayer = new WebAudioPlayer();
export default webPlayer;
