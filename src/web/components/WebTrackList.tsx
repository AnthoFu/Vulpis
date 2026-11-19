import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import styles from '../styles/web.styles';
import { WebTrack } from '../types';

const DEFAULT_COVER = require('../../../assets/default-cover.jpg');

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface WebTrackListProps {
  tracks?: WebTrack[];
  activeTrack?: WebTrack | null;
  isPlaying?: boolean;
  isLoadingAudio?: boolean;
  onPlayTrack: (track: WebTrack, queue: WebTrack[]) => void;
  onAddToQueue?: (track: WebTrack) => void;
  onRemoveFromQueue?: (index: number) => void;
  isQueueView?: boolean;
  isHistoryView?: boolean;
  isLocalView?: boolean;
  isDriveConnected?: boolean;
  onOpenDriveModal?: () => void;
  onOpenLocalFiles?: () => void;
  onShowToast?: (message: string) => void;
}

export default function WebTrackList({
  tracks = [],
  activeTrack,
  isPlaying,
  isLoadingAudio,
  onPlayTrack,
  onAddToQueue,
  onRemoveFromQueue,
  isQueueView = false,
  isHistoryView = false,
  isLocalView = false,
  isDriveConnected,
  onOpenDriveModal,
  onOpenLocalFiles,
  onShowToast,
}: WebTrackListProps): React.JSX.Element {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleAdd = (track: WebTrack, e: any) => {
    e?.stopPropagation?.();
    if (onAddToQueue) {
      onAddToQueue(track);
      setJustAddedId(track.id);
      if (onShowToast) {
        onShowToast(`"${track.title}" añadida a la cola`);
      }
      setTimeout(() => {
        setJustAddedId((curr) => (curr === track.id ? null : curr));
      }, 1500);
    }
  };

  const handleRemove = (idx: number, e: any) => {
    e?.stopPropagation?.();
    if (onRemoveFromQueue) {
      onRemoveFromQueue(idx);
    }
  };

  if (tracks.length === 0) {
    let emptyIcon: keyof typeof Ionicons.glyphMap = 'cloud-offline-outline';
    let emptyTitle = 'Tu biblioteca está vacía';
    let emptySubtitle = 'Conectá tu cuenta de Google Drive para sincronizar tus canciones.';
    let actionBtnText: string | null = 'Conectar Google Drive';
    let actionBtnHandler: (() => void) | undefined = onOpenDriveModal;

    if (isHistoryView) {
      emptyIcon = 'time-outline';
      emptyTitle = 'Sin reproducciones recientes';
      emptySubtitle = 'Las canciones que escuches durante al menos 10 segundos aparecerán acá.';
      actionBtnText = null;
    } else if (isQueueView) {
      emptyIcon = 'list-outline';
      emptyTitle = 'La cola de reproducción está vacía';
      emptySubtitle = 'Elegí cualquier canción para iniciar la reproducción o agregala a la cola.';
      actionBtnText = null;
    } else if (isLocalView) {
      emptyIcon = 'folder-open-outline';
      emptyTitle = 'Sin archivos de música local';
      emptySubtitle = 'Seleccioná canciones MP3 desde tu computadora para reproducir en el navegador.';
      actionBtnText = 'Cargar archivos MP3';
      actionBtnHandler = onOpenLocalFiles;
    } else if (isDriveConnected) {
      emptyIcon = 'musical-notes-outline';
      emptyTitle = 'No hay canciones en Google Drive';
      emptySubtitle = 'Sube canciones a tu carpeta Vulpis de Drive y pulsa sincronizar para verlas acá.';
      actionBtnText = null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={emptyIcon} size={48} color="#474B6A" />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>

        {actionBtnText && actionBtnHandler && (
          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 14, paddingHorizontal: 22, paddingVertical: 10 }]}
            onPress={actionBtnHandler}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{actionBtnText}</Text>
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
        <Text style={[styles.trackHeaderCell, styles.trackColInfo]}>Título</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColAlbum]}>Álbum</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColDuration]}>Duración</Text>
        <Text style={[styles.trackHeaderCell, styles.trackColActions]}>Acción</Text>
      </View>

      {/* Filas de canciones */}
      {tracks.map((track, idx) => {
        const isActive = activeTrack && activeTrack.id === track.id;
        const isCurrentLoading = isActive && isLoadingAudio;
        const isAdded = justAddedId === track.id;

        return (
          <TouchableOpacity
            key={track.id || idx}
            style={[styles.trackRow, isActive && styles.trackRowActive]}
            onPress={() => onPlayTrack(track, tracks)}
            activeOpacity={0.7}
          >
            {/* Índice o Indicador de reproducción */}
            <View style={styles.trackColIndex}>
              {isCurrentLoading ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : isActive && isPlaying ? (
                <Ionicons name="volume-high" size={16} color="#A78BFA" />
              ) : (
                <Text style={{ color: isActive ? '#A78BFA' : '#6F738E', fontSize: 13, fontWeight: '500' }}>
                  {idx + 1}
                </Text>
              )}
            </View>

            {/* Información de la pista */}
            <View style={styles.trackColInfo}>
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
                  {track.artist && track.artist !== 'Google Drive' ? track.artist : 'Artista desconocido'}
                </Text>
              </View>
            </View>

            {/* Álbum */}
            <Text style={styles.trackColAlbum} numberOfLines={1}>
              {track.album && track.album !== 'Nube Privada' ? track.album : '—'}
            </Text>

            {/* Duración */}
            <Text style={styles.trackColDuration} numberOfLines={1}>
              {formatDuration(track.duration)}
            </Text>

            {/* Acciones */}
            <View style={styles.trackColActions}>
              {isQueueView ? (
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={(e) => handleRemove(idx, e)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, isAdded && { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}
                    onPress={(e) => handleAdd(track, e)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={isAdded ? 'check' : 'plus-circle'}
                      size={16}
                      color={isAdded ? '#22C55E' : '#8E8F9E'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => onPlayTrack(track, tracks)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={isActive && isPlaying ? 'pause' : 'play'}
                      size={16}
                      color="#A78BFA"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
