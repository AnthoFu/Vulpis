import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from './styles/web.styles';

// Hooks
import useWebPlayer from './hooks/useWebPlayer';
import useWebDrive from './hooks/useWebDrive';
import useWebLyrics from './hooks/useWebLyrics';
import usePlaybackHistory from '../hooks/usePlaybackHistory';
import { Track } from '../models/Track';
import { parseTrackFilename } from '../utils/tagEditor';

// Componentes
import WebNavbar from './components/WebNavbar';
import WebSidebar from './components/WebSidebar';
import WebTrackList from './components/WebTrackList';
import WebPlayerBottomBar from './components/WebPlayerBottomBar';
import WebLyricsPanel from './components/WebLyricsPanel';
import WebDriveModal from './components/WebDriveModal';
import EqualizerModal from '../components/modals/EqualizerModal';
import { WebTrack } from './types';

export default function WebApp(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<'drive' | 'local' | 'queue' | 'history'>('drive');
  const [localTracks, setLocalTracks] = useState<WebTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2500);
  }, []);

  const handleOpenLocalFiles = useCallback(() => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.m4a,.flac,.wav,.ogg';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files: File[] = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const newTracks: WebTrack[] = files.map((file) => {
        const parsed = parseTrackFilename(file.name);
        const blobUrl = URL.createObjectURL(file);
        return {
          id: `local-${file.name}-${file.size}-${Date.now()}`,
          mediaId: `local-${file.name}-${file.size}`,
          title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: parsed.artist && parsed.artist !== 'Artista desconocido' ? parsed.artist : 'Local',
          album: parsed.album && parsed.album !== 'Desconocido' ? parsed.album : 'Música Local',
          artwork: null,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          source: 'local',
          url: blobUrl,
        };
      });

      setLocalTracks((prev) => [...prev, ...newTracks]);
      setCurrentView('local');
      showToast(`${files.length} archivo(s) cargado(s)`);
    };
    input.click();
  }, [showToast]);

  // Hook del reproductor de audio web
  const {
    currentTrack,
    queue,
    isPlaying,
    isLoading: isLoadingAudio,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    equalizerSettings,
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
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
  } = useWebPlayer();

  // Hook de Google Drive
  const {
    isDriveConnected,
    driveTracks,
    isLoading: isLoadingDrive,
    error: driveError,
    connectWithGoogle,
    connectWithManualToken,
    disconnectDrive,
    refreshTracks,
  } = useWebDrive();

  // Hook de Letras Sincronizadas
  const {
    lyricsData,
    isLoading: isLoadingLyrics,
    isPanelOpen: isLyricsOpen,
    activeLineIndex,
    togglePanel: toggleLyrics,
    handleLineClick: handleLyricSeek,
  } = useWebLyrics(currentTrack, currentTime, seek);

  // Conversión defensiva de la pista activa para el hook de historial
  const activeTrackForHistory = useMemo<Track | null>(() => {
    if (!currentTrack) return null;
    return {
      mediaId: currentTrack.mediaId || currentTrack.id,
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      duration: currentTrack.duration,
      artworkUrl: currentTrack.artwork,
      url: currentTrack.url || '',
    };
  }, [currentTrack]);

  // Hook de historial de reproducción web
  const { historyItems } = usePlaybackHistory({
    activeTrack: activeTrackForHistory,
    isPlaying,
    position: currentTime,
  });

  const historyWebTracks = useMemo<WebTrack[]>(() => {
    return historyItems.map((h) => ({
      id: h.track.mediaId,
      mediaId: h.track.mediaId,
      title: h.track.title,
      artist: h.track.artist,
      album: h.track.album || '',
      duration: h.track.duration,
      artwork: h.track.artworkUrl,
      source: 'history',
      url: h.track.url,
    }));
  }, [historyItems]);

  // Filtrado de canciones según el buscador
  const displayedTracks = useMemo<WebTrack[]>(() => {
    let sourceList = driveTracks;
    if (currentView === 'queue') {
      sourceList = queue;
    } else if (currentView === 'history') {
      sourceList = historyWebTracks;
    } else if (currentView === 'local') {
      sourceList = localTracks;
    }

    if (!searchQuery.trim()) return sourceList;

    const q = searchQuery.toLowerCase().trim();
    return sourceList.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q))
    );
  }, [currentView, queue, driveTracks, localTracks, historyWebTracks, searchQuery]);

  return (
    <View style={styles.appContainer}>
      {/* Notificación Toast flotante */}
      {toast && (
        <View style={styles.toastContainer}>
          <Feather name="check-circle" size={16} color="#A78BFA" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* 1. Barra de Navegación Superior */}
      <WebNavbar
        isDriveConnected={isDriveConnected}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onRefreshDrive={refreshTracks}
        onDisconnectDrive={disconnectDrive}
        onOpenLocalFiles={handleOpenLocalFiles}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Cuerpo Central (Sidebar + Lista de Contenido) */}
      <View style={styles.mainLayout}>
        <WebSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          queueCount={queue.length}
          driveTrackCount={driveTracks.length}
          localTrackCount={localTracks.length}
          historyCount={historyItems.length}
          onToggleLyrics={toggleLyrics}
          isLyricsOpen={isLyricsOpen}
          onToggleEqualizer={() => setIsEqualizerOpen((prev) => !prev)}
          isEqualizerOpen={isEqualizerOpen}
        />

        {/* Área Principal de Contenido */}
        <View style={styles.contentArea}>
          <View style={styles.contentHeader}>
            <View>
              <Text style={styles.contentTitle}>
                {currentView === 'queue'
                  ? 'Cola de Reproducción'
                  : currentView === 'history'
                  ? 'Historial de Reproducción'
                  : currentView === 'local'
                  ? 'Música Local'
                  : 'Biblioteca en Google Drive'}
              </Text>
              <Text style={styles.contentSubtitle}>
                {currentView === 'queue'
                  ? `${queue.length} ${queue.length === 1 ? 'canción' : 'canciones'}`
                  : currentView === 'history'
                  ? `${historyItems.length} ${historyItems.length === 1 ? 'canción reciente' : 'canciones recientes'}`
                  : currentView === 'local'
                  ? `${localTracks.length} ${localTracks.length === 1 ? 'canción cargada' : 'canciones cargadas del dispositivo'}`
                  : isDriveConnected
                  ? `${driveTracks.length} ${driveTracks.length === 1 ? 'canción sincronizada' : 'canciones sincronizadas en la nube'}`
                  : 'Conectá tu cuenta de Google Drive para sincronizar tu música'}
              </Text>
            </View>

            {isLoadingDrive && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={{ color: '#8E8F9E', fontSize: 13 }}>Sincronizando Drive...</Text>
              </View>
            )}
          </View>

          {/* Tabla de canciones */}
          <WebTrackList
            tracks={displayedTracks}
            activeTrack={currentTrack}
            isPlaying={isPlaying}
            isLoadingAudio={isLoadingAudio}
            onPlayTrack={playTrack}
            onAddToQueue={addToQueue}
            onRemoveFromQueue={removeFromQueue}
            isQueueView={currentView === 'queue'}
            isHistoryView={currentView === 'history'}
            isLocalView={currentView === 'local'}
            isDriveConnected={isDriveConnected}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onOpenLocalFiles={handleOpenLocalFiles}
            onShowToast={showToast}
          />
        </View>

        {/* 3. Panel Lateral Desplegable de Letras */}
        {isLyricsOpen && (
          <WebLyricsPanel
            lyricsData={lyricsData}
            isLoading={isLoadingLyrics}
            activeLineIndex={activeLineIndex}
            onLineClick={handleLyricSeek}
            onClose={toggleLyrics}
          />
        )}
      </View>

      {/* 4. Barra de Reproducción Inferior Fija */}
      <WebPlayerBottomBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoadingAudio}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onTogglePlay={togglePlay}
        onNext={next}
        onPrevious={previous}
        onSeek={seek}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleLyrics={toggleLyrics}
        isLyricsOpen={isLyricsOpen}
        onToggleEqualizer={() => setIsEqualizerOpen((prev) => !prev)}
        isEqualizerOpen={isEqualizerOpen}
        isEqualizerEnabled={equalizerSettings?.enabled ?? false}
      />

      {/* 5. Modal de Conexión de Google Drive */}
      <WebDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onConnectGoogle={async (clientId) => {
          const ok = await connectWithGoogle(clientId);
          if (ok) setIsDriveModalOpen(false);
        }}
        onConnectToken={async (token) => {
          const ok = await connectWithManualToken(token);
          if (ok) setIsDriveModalOpen(false);
        }}
        isLoading={isLoadingDrive}
        errorMessage={driveError}
      />

      {/* 6. Modal del Ecualizador de Audio */}
      <EqualizerModal
        visible={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        settings={equalizerSettings}
        onToggle={handleToggleEqualizer}
        onSelectPreset={handleSelectPreset}
        onUpdateBandGain={handleUpdateBandGain}
        onUpdateBassBoost={handleUpdateBassBoost}
        onReset={handleResetEqualizer}
      />
    </View>
  );
}
