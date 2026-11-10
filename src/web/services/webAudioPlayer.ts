/**
 * Motor de Audio para la versión Web de Vulpis.
 * Envuelve el elemento HTML5 <audio> con gestión completa de cola,
 * shuffle, repeat, buffering, notificaciones de estado y procesamiento
 * acústico en tiempo real con Web Audio API (BiquadFilterNode para 5 bandas + Bass Boost).
 */

import { WebTrack, WebPlayerState, WebRepeatMode } from '../types';
import {
  EqualizerSettings,
  EqualizerPresetId,
  DEFAULT_EQUALIZER_SETTINGS,
} from '../../models/EqualizerSettings';
import {
  getEqualizerSettings,
  saveEqualizerSettings,
  applyPresetToBands,
  detectPresetFromGains,
} from '../../utils/equalizer';

export class WebAudioPlayer {
  private audio: HTMLAudioElement | null;
  private queue: WebTrack[];
  private originalQueue: WebTrack[];
  private currentIndex: number;
  private currentTrack: WebTrack | null;
  private isPlaying: boolean;
  private isLoading: boolean;
  private currentTime: number;
  private duration: number;
  private volume: number;
  private isMuted: boolean;
  private isShuffle: boolean;
  private repeatMode: WebRepeatMode;
  private listeners: Set<(state: WebPlayerState) => void>;
  private driveTokenGetter: (() => string | null) | null;

  // Nodos y contexto de la Web Audio API
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassBoostNode: BiquadFilterNode | null = null;
  private bandNodes: BiquadFilterNode[] = [];
  private equalizerSettings: EqualizerSettings = DEFAULT_EQUALIZER_SETTINGS;

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

    // Cargar configuración guardada del ecualizador
    if (typeof window !== 'undefined') {
      getEqualizerSettings().then((loaded) => {
        this.equalizerSettings = loaded;
        this._applyEqualizerToNodes();
        this._notify();
      });
    }
  }

  setDriveTokenGetter(fn: () => string | null): void {
    this.driveTokenGetter = fn;
  }

  /**
   * Inicializa de forma perezosa el grafo de Web Audio API ante el primer gesto del usuario.
   */
  private _initAudioContext(): void {
    if (typeof window === 'undefined' || !this.audio || this.audioCtx) return;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.audioCtx = new AudioContextClass();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      // Filtro de refuerzo de graves (lowshelf centrado en 80 Hz)
      this.bassBoostNode = this.audioCtx.createBiquadFilter();
      this.bassBoostNode.type = 'lowshelf';
      this.bassBoostNode.frequency.value = 80;
      this.bassBoostNode.gain.value = 0;

      // 5 Bandas de frecuencia estándar: 60Hz, 230Hz, 910Hz, 3600Hz, 14000Hz
      const freqs = [60, 230, 910, 3600, 14000];
      this.bandNodes = freqs.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === 4 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });

      // Conexión en cascada: source -> bassBoost -> band0 -> band1 -> band2 -> band3 -> band4 -> destination
      let currentChain: AudioNode = this.sourceNode;
      currentChain.connect(this.bassBoostNode);
      currentChain = this.bassBoostNode;

      for (const bandNode of this.bandNodes) {
        currentChain.connect(bandNode);
        currentChain = bandNode;
      }

      currentChain.connect(this.audioCtx.destination);
      this._applyEqualizerToNodes();
    } catch (err) {
      console.warn('[WebAudioPlayer] Error al inicializar Web Audio API:', err);
    }
  }

  /**
   * Aplica las ganancias de las bandas y refuerzo de graves a los nodos de audio activos
   * usando rampa suave exponencial (setTargetAtTime) para evitar chasquidos acústicos.
   */
  private _applyEqualizerToNodes(): void {
    if (!this.audioCtx || this.bandNodes.length === 0) return;

    const isEnabled = this.equalizerSettings.enabled;
    const now = this.audioCtx.currentTime;

    // 1. Refuerzo de graves (Bass Boost)
    if (this.bassBoostNode) {
      const targetBass = isEnabled ? this.equalizerSettings.bassBoost : 0;
      this.bassBoostNode.gain.setTargetAtTime(targetBass, now, 0.05);
    }

    // 2. 5 Bandas de frecuencia
    this.bandNodes.forEach((node, idx) => {
      const targetGain = isEnabled ? (this.equalizerSettings.bands[idx]?.gain ?? 0) : 0;
      node.gain.setTargetAtTime(targetGain, now, 0.05);
    });
  }

  private _setupAudioListeners(): void {
    if (!this.audio) return;

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
      if (!this.audio) return;
      this.currentTime = this.audio.currentTime || 0;
      this.duration = this.audio.duration || this.duration || 0;
      this._notify();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audio) return;
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

  private _handleTrackEnded(): void {
    if (!this.audio) return;

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

  subscribe(listener: (state: WebPlayerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private _notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[WebAudioPlayer] Error en listener:', err);
      }
    });
  }

  getState(): WebPlayerState {
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
      equalizerSettings: this.equalizerSettings,
    };
  }

  async playTrack(track: WebTrack, newQueue: WebTrack[] | null = null): Promise<void> {
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

      if (this.audio) {
        this.audio.src = audioUrl;
        this.audio.load();

        // Inicializar y reanudar Web Audio API
        this._initAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        await this.audio.play();
      }
    } catch (err) {
      console.error('[WebAudioPlayer] Error al cargar o reproducir:', err);
      this.isLoading = false;
      this.isPlaying = false;
      this._notify();
    }
  }

  async playIndex(index: number): Promise<void> {
    if (index >= 0 && index < this.queue.length) {
      this.currentIndex = index;
      await this.playTrack(this.queue[index]);
    }
  }

  togglePlay(): void {
    if (!this.audio || !this.currentTrack) return;

    this._initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(console.warn);
    }

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(console.warn);
    }
  }

  seek(seconds: number): void {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(seconds, this.duration || seconds));
    this.audio.currentTime = clamped;
    this.currentTime = clamped;
    this._notify();
  }

  setVolume(vol: number): void {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    this.audio.volume = clamped;
    this.isMuted = clamped === 0;
    this._notify();
  }

  toggleMute(): void {
    if (!this.audio) return;
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    this._notify();
  }

  next(): void {
    if (this.queue.length === 0) return;
    if (this.currentIndex < this.queue.length - 1) {
      this.playIndex(this.currentIndex + 1);
    } else if (this.repeatMode === 'queue') {
      this.playIndex(0);
    }
  }

  previous(): void {
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

  toggleShuffle(): void {
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

  toggleRepeat(): void {
    const modes: WebRepeatMode[] = ['off', 'queue', 'track'];
    const nextIdx = (modes.indexOf(this.repeatMode) + 1) % modes.length;
    this.repeatMode = modes[nextIdx];
    this._notify();
  }

  addToQueue(track: WebTrack): void {
    this.queue.push(track);
    this.originalQueue.push(track);
    this._notify();
  }

  removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.length) {
      const removed = this.queue.splice(index, 1)[0];
      this.originalQueue = this.originalQueue.filter((t) => t.id !== removed.id);
      if (index < this.currentIndex) {
        this.currentIndex--;
      }
      this._notify();
    }
  }

  // ==========================================
  // Métodos del Ecualizador de Audio (Web)
  // ==========================================

  getEqualizerSettings(): EqualizerSettings {
    return this.equalizerSettings;
  }

  async setEqualizerSettings(settings: EqualizerSettings): Promise<void> {
    this.equalizerSettings = settings;
    this._applyEqualizerToNodes();
    this._notify();
    await saveEqualizerSettings(settings);
  }

  async toggleEqualizer(enabled?: boolean): Promise<void> {
    const nextEnabled = enabled !== undefined ? enabled : !this.equalizerSettings.enabled;
    const updated: EqualizerSettings = {
      ...this.equalizerSettings,
      enabled: nextEnabled,
    };
    await this.setEqualizerSettings(updated);
  }

  async setEqualizerPreset(presetId: EqualizerPresetId): Promise<void> {
    const { bands, bassBoost } = applyPresetToBands(presetId);
    const updated: EqualizerSettings = {
      ...this.equalizerSettings,
      presetId,
      bands,
      bassBoost,
    };
    await this.setEqualizerSettings(updated);
  }

  async updateBandGain(bandIndex: number, gain: number): Promise<void> {
    const clamped = Math.round(Math.max(-10, Math.min(10, gain)));
    const updatedBands = this.equalizerSettings.bands.map((b, idx) =>
      idx === bandIndex ? { ...b, gain: clamped } : b
    );
    const detectedPreset = detectPresetFromGains(updatedBands, this.equalizerSettings.bassBoost);
    const updated: EqualizerSettings = {
      ...this.equalizerSettings,
      bands: updatedBands,
      presetId: detectedPreset,
    };
    await this.setEqualizerSettings(updated);
  }

  async updateBassBoost(bassBoost: number): Promise<void> {
    const clamped = Math.round(Math.max(0, Math.min(10, bassBoost)));
    const detectedPreset = detectPresetFromGains(this.equalizerSettings.bands, clamped);
    const updated: EqualizerSettings = {
      ...this.equalizerSettings,
      bassBoost: clamped,
      presetId: detectedPreset,
    };
    await this.setEqualizerSettings(updated);
  }

  async resetEqualizer(): Promise<void> {
    const { bands, bassBoost } = applyPresetToBands('flat');
    const updated: EqualizerSettings = {
      ...this.equalizerSettings,
      presetId: 'flat',
      bands,
      bassBoost,
    };
    await this.setEqualizerSettings(updated);
  }

  private _shuffleArray<T>(arr: T[]): T[] {
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
