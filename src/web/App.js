import React, { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import styles from './styles/web.styles';

// Hooks
import useWebPlayer from './hooks/useWebPlayer';
import useWebDrive from './hooks/useWebDrive';
import useWebLyrics from './hooks/useWebLyrics';

// Componentes
import WebNavbar from './components/WebNavbar';
import WebSidebar from './components/WebSidebar';
import WebTrackList from './components/WebTrackList';
import WebPlayerBottomBar from './components/WebPlayerBottomBar';
import WebLyricsPanel from './components/WebLyricsPanel';
import WebDriveModal from './components/WebDriveModal';

export default function WebApp() {
  const [currentView, setCurrentView] = useState('drive'); // 'drive' | 'queue'
  const [searchQuery, setSearchQuery] = useState('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

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

  // Filtrado de canciones según el buscador
  const displayedTracks = useMemo(() => {
    const sourceList = currentView === 'queue' ? queue : driveTracks;
    if (!searchQuery.trim()) return sourceList;

    const q = searchQuery.toLowerCase().trim();
    return sourceList.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q))
    );
  }, [currentView, queue, driveTracks, searchQuery]);

  return (
    <View style={styles.appContainer}>
      {/* 1. Barra de Navegación Superior */}
      <WebNavbar
        isDriveConnected={isDriveConnected}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onRefreshDrive={refreshTracks}
        onDisconnectDrive={disconnectDrive}
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
          onToggleLyrics={toggleLyrics}
          isLyricsOpen={isLyricsOpen}
        />

        {/* Área Principal de Contenido */}
        <View style={styles.contentArea}>
          <View style={styles.contentHeader}>
            <View>
              <Text style={styles.contentTitle}>
                {currentView === 'queue' ? 'Cola de Reproducción' : 'Música en Google Drive'}
              </Text>
              <Text style={styles.contentSubtitle}>
                {currentView === 'queue'
                  ? `${queue.length} canción(es) en cola`
                  : isDriveConnected
                  ? `${driveTracks.length} archivo(s) disponibles en tu nube privada`
                  : 'Conecta tu cuenta de Google Drive para cargar tu música'}
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
            isDriveConnected={isDriveConnected}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
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
    </View>
  );
}
