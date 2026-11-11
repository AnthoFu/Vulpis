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
import {
  Header,
  PlayerCard,
  MiniPlayer,
  QueueList,
  SidebarDrawer,
  SettingsModal,
  EqualizerModal,
  HistoryModal,
} from './src/components';
import { PlayerProvider, usePlayer } from './src/context';

/**
 * Contenedor visual principal de Vulpis.
 * Consume directamente el estado de `PlayerContext`, eliminando el prop-drilling en cascada.
 */
function MainApp(): React.JSX.Element {
  const {
    insets,
    isPlayerInitialized,
    activeTrack,
    isFullPlayerVisible,
    setIsFullPlayerVisible,
    toast,
    equalizerSettings,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isSystemEqualizerAvailable,
    handleToggleEqualizer,
    handleSelectPreset,
    handleUpdateBandGain,
    handleUpdateBassBoost,
    handleResetEqualizer,
    handleOpenSystemEqualizer,
    historyItems,
    isHistoryOpen,
    setIsHistoryOpen,
    handleClearHistory,
    handleRemoveHistoryItem,
    handleSelectTrack,
    handleAddToQueue,
  } = usePlayer();

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
      
      {/* Notificación flotante Toast */}
      {toast && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top + 10, 40) }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      
      {/* Lista y pestañas de la biblioteca musical */}
      <QueueList
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20) + (activeTrack ? 80 : 0),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        }}
        ListHeaderComponent={<Header />}
      />

      {/* Mini reproductor flotante persistente */}
      <MiniPlayer />

      {/* Modal del reproductor a pantalla completa */}
      <Modal
        visible={isFullPlayerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsFullPlayerVisible(false)}
      >
        <PlayerCard />
      </Modal>

      {/* Menú lateral de navegación */}
      <SidebarDrawer />

      {/* Modal de Ajustes generales */}
      <SettingsModal />

      {/* Modal del Ecualizador de Audio */}
      <EqualizerModal
        visible={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        settings={equalizerSettings}
        isSystemEqualizerAvailable={isSystemEqualizerAvailable}
        onToggle={handleToggleEqualizer}
        onSelectPreset={handleSelectPreset}
        onUpdateBandGain={handleUpdateBandGain}
        onUpdateBassBoost={handleUpdateBassBoost}
        onReset={handleResetEqualizer}
        onOpenSystemEqualizer={handleOpenSystemEqualizer}
      />

      {/* Modal del Historial de Reproducción */}
      <HistoryModal
        visible={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        activeTrack={activeTrack}
        onSelectTrack={handleSelectTrack}
        onRemoveItem={handleRemoveHistoryItem}
        onClearHistory={handleClearHistory}
        onAddToQueue={handleAddToQueue}
      />
    </View>
  );
}

/**
 * Punto de entrada de la aplicación móvil.
 * Configura los proveedores de contexto de SafeArea y de Reproducción (`PlayerProvider`).
 */
export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}
