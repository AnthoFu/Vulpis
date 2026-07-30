import React from 'react';
import { Text, View, Image, TouchableOpacity, FlatList, Animated, StyleSheet } from 'react-native';
import styles from '../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from './ProgressBar';
import Controls from './Controls';
import usePlayerCard from '../hooks/usePlayerCard';

export default function PlayerCard({
  activeTrack,
  isPlaying,
  position,
  duration,
  repeatMode,
  isShuffleActive,
  tracks,
  playQueue,
  onRemoveFromQueue,
  onClose,
  onSelectTrack,
  initialQueueVisible = false,
}) {
  const insets = useSafeAreaInsets();
  
  const {
    isQueueVisible,
    setIsQueueVisible,
    colorA,
    colorB,
    fadeAnim,
    defaultTrack,
    currentTrackTitle,
    currentTrackArtist,
    currentTrackArtwork,
    selectTrackFromQueue,
  } = usePlayerCard({
    activeTrack,
    tracks,
    initialQueueVisible,
  });

  const renderBackground = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Capa A (Color Base / Anterior) */}
        <LinearGradient
          colors={[colorA, '#090A0F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Capa B (Color de Destino, Desvaneciéndose) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colorB, '#090A0F']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        {/* Superposición oscura para asegurar que el texto sea siempre legible */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 10, 15, 0.4)' }]} />
      </View>
    );
  };

  // Si la superposición interna de la cola es visible, renderizarla
  if (isQueueVisible) {
    return (
      <View
        style={[
          styles.playerFullScreen,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {renderBackground()}
        {/* Fila de encabezado */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setIsQueueVisible(false)} style={styles.closeButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COLA DE REPRODUCCIÓN</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        
        {/* Lista deslizable de la cola */}
        <FlatList
          data={playQueue || []}
          keyExtractor={(item, index) => `${item.mediaId}-${index}`}
          contentContainerStyle={styles.queueListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isCurrent = activeTrack ? activeTrack.mediaId === item.mediaId : false;
            return (
              <View style={[styles.queueItem, isCurrent && styles.queueItemActive]}>
                <TouchableOpacity
                  onPress={() => selectTrackFromQueue(index)}
                  style={styles.queueItemMainContent}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.artworkUrl || defaultTrack.artworkUrl }} style={styles.queueArtwork} />
                  <View style={styles.queueDetails}>
                    <Text style={[styles.queueTitle, isCurrent && styles.queueTextActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isCurrent ? (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingIndicatorText}>SONANDO</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => onRemoveFromQueue && onRemoveFromQueue(item, index)}
                    style={styles.removeButton}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      </View>
    );
  }

  // Vista normal del reproductor en pantalla completa
  return (
    <View
      style={[
        styles.playerFullScreen,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      {renderBackground()}
      {/* Fila de encabezado */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SONANDO AHORA</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Sección de portada con contenedor de sombra */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkShadowWrapper}>
          <Image
            source={{ uri: currentTrackArtwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        </View>
      </View>
      
      {/* Detalles de la pista, progreso y controles */}
      <View style={styles.bottomSection}>
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrackTitle}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrackArtist}
          </Text>
        </View>

        <ProgressBar position={position} duration={duration} />
        
        <Controls
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          isShuffleActive={isShuffleActive}
          tracks={tracks}
          playQueue={playQueue}
          activeTrack={activeTrack}
          onSelectTrack={onSelectTrack}
        />

        {/* Botón de controles de pie de página */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => setIsQueueVisible(true)}
            style={styles.footerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-play" size={22} color="#8E8F9E" style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonText}>Ver Cola de Reproducción</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
