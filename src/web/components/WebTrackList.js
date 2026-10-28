import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

const DEFAULT_COVER = require('../../../assets/default-cover.jpg');

export default function WebTrackList({
  tracks = [],
  activeTrack,
  isPlaying,
  isLoadingAudio,
  onPlayTrack,
  onAddToQueue,
  onRemoveFromQueue,
  isQueueView = false,
  isDriveConnected,
  onOpenDriveModal,
}) {
  if (tracks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isQueueView ? 'list-outline' : 'cloud-offline-outline'}
          size={54}
          color="#3B3E5B"
        />
        <Text style={styles.emptyTitle}>
          {isQueueView ? 'La cola de reproducción está vacía' : 'No hay canciones disponibles'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isQueueView
            ? 'Selecciona una canción de tu biblioteca de Google Drive para empezar a reproducir.'
            : isDriveConnected
            ? 'No se encontraron archivos .mp3 en tu carpeta Vulpis de Google Drive. Sube música a tu Drive para verla aquí.'
            : 'Conecta tu cuenta de Google Drive para acceder a tu música en la nube privada.'}
        </Text>
        {!isDriveConnected && !isQueueView && (
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 12, paddingHorizontal: 20 }]} onPress={onOpenDriveModal}>
            <Text style={styles.btnText}>Conectar Google Drive</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.trackListContainer}>
      {/* Cabecera de la tabla */}
      <View style={styles.trackTableHeader}>
        <Text style={[styles.trackHeaderCell, styles.trackColIndex]}>#</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColInfo]}>Título / Artista</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColSize]}>Tamaño</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColActions]}>Acción</Text>
      </View>

      {/* Filas de canciones */}
      {tracks.map((track, idx) => {
        const isActive = activeTrack && activeTrack.id === track.id;
        const isCurrentLoading = isActive && isLoadingAudio;

        return (
          <View
            key={track.id || idx}
            style={[styles.trackRow, isActive && styles.trackRowActive]}
          >
            {/* Índice o Indicador de reproducción */}
            <TouchableOpacity
              style={styles.trackColIndex}
              onPress={() => onPlayTrack(track, tracks)}
            >
              {isCurrentLoading ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : isActive && isPlaying ? (
                <Ionicons name="volume-high" size={16} color="#A78BFA" />
              ) : (
                <Text style={{ color: isActive ? '#A78BFA' : '#6F738E', fontSize: 13, fontWeight: '500' }}>
                  {idx + 1}
                </Text>
              )}
            </TouchableOpacity>

            {/* Información de la pista */}
            <TouchableOpacity
              style={styles.trackColInfo}
              onPress={() => onPlayTrack(track, tracks)}
            >
              <Image
                source={track.artwork ? { uri: track.artwork } : DEFAULT_COVER}
                style={styles.trackCoverImg}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.trackTitle, isActive && styles.trackTitleActive]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist || 'Google Drive'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Tamaño */}
            <Text style={styles.trackColSize} numberOfLines={1}>
              {track.size || '--'}
            </Text>

            {/* Acciones */}
            <View style={styles.trackColActions}>
              {isQueueView ? (
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => onRemoveFromQueue && onRemoveFromQueue(idx)}
                  title="Quitar de la cola"
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => onAddToQueue && onAddToQueue(track)}
                    title="Añadir a la cola"
                  >
                    <Feather name="plus-circle" size={16} color="#8E8F9E" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => onPlayTrack(track, tracks)}
                    title="Reproducir ahora"
                  >
                    <Feather name="play" size={16} color="#A78BFA" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
