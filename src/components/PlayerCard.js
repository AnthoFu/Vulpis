import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image, TouchableOpacity, FlatList, Animated } from 'react-native';
import styles from '../styles/PlayerCard.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer from '@rntp/player';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import ProgressBar from './ProgressBar';
import Controls from './Controls';

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
  const [isQueueVisible, setIsQueueVisible] = useState(initialQueueVisible);

  useEffect(() => {
    setIsQueueVisible(initialQueueVisible);
  }, [initialQueueVisible]);
  const defaultCover = Image.resolveAssetSource(require('../../assets/default-cover.jpg')).uri;
  const defaultTrack = tracks && tracks.length > 0 ? tracks[0] : { title: 'No Track', artist: 'No Artist', artworkUrl: defaultCover };
  
  const currentTrackTitle = activeTrack?.title ?? defaultTrack.title;
  const currentTrackArtist = activeTrack?.artist ?? defaultTrack.artist;
  const currentTrackArtwork = activeTrack?.artworkUrl ?? defaultTrack.artworkUrl;

  const [colorA, setColorA] = useState('#161722');
  const [colorB, setColorB] = useState('#161722');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    
    const fetchColors = async () => {
      if (!currentTrackArtwork) return;
      try {
        const result = await ImageColors.getColors(currentTrackArtwork, {
          fallback: '#161722',
          cache: true,
          key: currentTrackArtwork,
        });

        let newColor = '#161722';
        if (result.type === 'android') {
          newColor = result.dominant || result.vibrant || result.darkVibrant || '#161722';
        } else if (result.type === 'ios') {
          newColor = result.primary || result.background || '#161722';
        } else if (result.type === 'web') {
          newColor = result.dominant || '#161722';
        }

        if (isMounted) {
          setColorB(newColor);
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            if (isMounted) {
              setColorA(newColor);
              fadeAnim.setValue(0);
            }
          });
        }
      } catch (e) {
        console.error('Error al obtener colores de la imagen:', e);
      }
    };

    fetchColors();

    return () => {
      isMounted = false;
    };
  }, [currentTrackArtwork]);

  const selectTrackFromQueue = async (index) => {
    try {
      console.log(`[PlayerCard Queue] Saltando al índice: ${index}`);
      await TrackPlayer.skipToIndex(index);
      await TrackPlayer.play();
    } catch (e) {
      console.error('[PlayerCard Queue] Error al saltar al índice:', e);
    }
  };

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




