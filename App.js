import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StatusBar,
  Modal,
} from 'react-native';
import styles from './src/styles/App.styles';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Header from './src/components/Header';
import PlayerCard from './src/components/PlayerCard';
import MiniPlayer from './src/components/MiniPlayer';
import QueueList from './src/components/QueueList';
import SidebarDrawer from './src/components/SidebarDrawer';
import useAppController from './src/hooks/useAppController';

function MainApp() {
  const {
    insets,
    isPlayerInitialized,
    activeTrack,
    isPlaying,
    progress,
    repeatMode,
    isShuffleActive,
    isFullPlayerVisible,
    setIsFullPlayerVisible,
    startWithQueueVisible,
    setStartWithQueueVisible,
    playQueue,
    isDrawerOpen,
    setIsDrawerOpen,
    currentSource,
    tracks,
    isSourceChanging,
    toast,
    playlists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
    handleRemoveTrackFromPlaylist,
    hasCustomLocalTracks,
    handleScanLocal,
    handleImportMp3,
    handleResetLocal,
    handleDeleteLocalTrack,
    isDriveConnected,
    googleClientId,
    googleRedirectUri,
    isDriveLoading,
    handleConnectDrive,
    handleDisconnectDrive,
    handleRefreshDrive,
    handleUploadTrackToDrive,
    handleUploadLocalTrackToDrive,
    handleDeleteDriveTrack,
    handleDownloadDriveTrack,
    handleAddToQueue,
    handleRemoveFromQueue,
    handleReorderQueueState,
    handleSyncReorderNative,
    handleSetDragActive,
    handleSourceChange,
    handleSelectTrack,
  } = useAppController();

  if (!isPlayerInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando Vulpis Player...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      
      {toast && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top + 10, 40) }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      
      <QueueList
        activeTrack={activeTrack}
        tracks={tracks}
        playQueue={playQueue}
        isLoading={isSourceChanging}
        currentSource={currentSource}
        onScanLocal={handleScanLocal}
        onImportMp3={handleImportMp3}
        onResetLocal={handleResetLocal}
        onDeleteLocalTrack={handleDeleteLocalTrack}
        hasCustomLocalTracks={hasCustomLocalTracks}
        onAddToQueue={handleAddToQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        isDriveConnected={isDriveConnected}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onRefreshDrive={handleRefreshDrive}
        onUploadTrackToDrive={handleUploadTrackToDrive}
        onUploadLocalTrackToDrive={handleUploadLocalTrackToDrive}
        onDeleteDriveTrack={handleDeleteDriveTrack}
        onDownloadDriveTrack={handleDownloadDriveTrack}
        isDriveLoading={isDriveLoading}
        googleClientId={googleClientId}
        googleRedirectUri={googleRedirectUri}
        onSelectTrack={handleSelectTrack}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
        onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20) + (activeTrack ? 80 : 0),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }}
        ListHeaderComponent={
          <Header onMenuPress={() => setIsDrawerOpen(true)} />
        }
      />

      {/* Mini reproductor flotante */}
      <MiniPlayer
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        position={progress.position}
        duration={progress.duration}
        onPress={() => {
          setStartWithQueueVisible(false);
          setIsFullPlayerVisible(true);
        }}
        onQueuePress={() => {
          setStartWithQueueVisible(true);
          setIsFullPlayerVisible(true);
        }}
        tracks={tracks}
        playQueue={playQueue}
        onSelectTrack={handleSelectTrack}
        isShuffleActive={isShuffleActive}
      />

      {/* Modal del reproductor a pantalla completa */}
      <Modal
        visible={isFullPlayerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsFullPlayerVisible(false)}
      >
        <PlayerCard
          activeTrack={activeTrack}
          isPlaying={isPlaying}
          position={progress.position}
          duration={progress.duration}
          repeatMode={repeatMode}
          isShuffleActive={isShuffleActive}
          tracks={tracks}
          playQueue={playQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
          onReorderQueueState={handleReorderQueueState}
          onSyncReorderNative={handleSyncReorderNative}
          onDragActive={handleSetDragActive}
          onClose={() => setIsFullPlayerVisible(false)}
          onSelectTrack={handleSelectTrack}
          initialQueueVisible={startWithQueueVisible}
        />
      </Modal>

      {/* Menú lateral de navegación */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentSource={currentSource}
        onSelectSource={handleSourceChange}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}
