import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import TrackPlayer from '@rntp/player';
import { extractMetadata } from '../utils/metadata';
import { scanDeviceAudio } from '../services/scanner/mediaScanner';
import { localTracks } from '../constants/tracks';
import { Track } from '../models/Track';
import { writePhysicalId3v1Tag } from '../utils/tagEditor';

export interface UseLocalLibraryParams {
  currentSource: string;
  setTracks: Dispatch<SetStateAction<Track[]>>;
  defaultCover: any;
  setIsSourceChanging: Dispatch<SetStateAction<boolean>>;
  playQueue?: Track[];
  setPlayQueue?: Dispatch<SetStateAction<Track[]>>;
  setActiveTrack?: Dispatch<SetStateAction<Track | null>>;
  setIsPlaying?: Dispatch<SetStateAction<boolean>>;
  showToast?: (message: string) => void;
}

export interface UseLocalLibraryReturn {
  localLibraryTracks: Track[];
  setLocalLibraryTracks: Dispatch<SetStateAction<Track[]>>;
  hasCustomLocalTracks: boolean;
  setHasCustomLocalTracks: Dispatch<SetStateAction<boolean>>;
  saveLocalTracks: (newTracksList: Track[], shouldUpdatePlayer?: boolean) => Promise<void>;
  handleScanLocal: (options?: { silent?: boolean }) => Promise<Track[]>;
  handleImportMp3: () => Promise<void>;
  handleResetLocal: () => Promise<void>;
  handleDeleteLocalTrack: (track: Track) => Promise<void>;
  handleBatchDeleteLocalTracks: (tracks: Track[]) => Promise<void>;
  handleUpdateLocalTrackMetadata: (
    track: Track,
    newTags: { title: string; artist: string; album: string; genre: string }
  ) => Promise<boolean>;
  handleUpdateLocalTrackArtwork: (
    track: Track,
    newArtworkUrl: string
  ) => Promise<boolean>;
}

export default function useLocalLibrary({
  currentSource,
  setTracks,
  defaultCover,
  setIsSourceChanging,
  playQueue,
  setPlayQueue,
  setActiveTrack,
  setIsPlaying,
  showToast,
}: UseLocalLibraryParams): UseLocalLibraryReturn {
  const [localLibraryTracks, setLocalLibraryTracks] = useState<Track[]>(localTracks);
  const [hasCustomLocalTracks, setHasCustomLocalTracks] = useState(false);

  const currentSourceRef = useRef(currentSource);
  const localTracksRef = useRef(localLibraryTracks);

  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  useEffect(() => {
    localTracksRef.current = localLibraryTracks;
  }, [localLibraryTracks]);

  const saveLocalTracks = async (newTracksList: Track[], shouldUpdatePlayer = true): Promise<void> => {
    setLocalLibraryTracks(newTracksList);
    setHasCustomLocalTracks(true);
    await AsyncStorage.setItem('vulpis_local_tracks', JSON.stringify(newTracksList));

    if (currentSourceRef.current === 'local') {
      setTracks(newTracksList);

      if (shouldUpdatePlayer) {
        try {
          const active = TrackPlayer.getActiveMediaItem() as Track | null;
          await TrackPlayer.clear();
          await TrackPlayer.setMediaItems(newTracksList as any);

          if (active) {
            const idx = newTracksList.findIndex((t) => t.mediaId === active.mediaId);
            if (idx !== -1) {
              await TrackPlayer.skipToIndex(idx);
            } else {
              await TrackPlayer.skipToIndex(0);
            }
          } else {
            await TrackPlayer.skipToIndex(0);
          }
        } catch (err) {
          console.error('[saveLocalTracks] Error al sincronizar TrackPlayer:', err);
        }
      }
    }
  };

  /**
   * Escaneo ultra-optimizado con caché incremental y procesamiento por lotes no bloqueante.
   */
  const handleScanLocal = async (options: { silent?: boolean } = {}): Promise<Track[]> => {
    const isSilent = typeof options === 'object' && options?.silent === true;
    try {
      if (!isSilent) {
        setIsSourceChanging(true);
      }

      const { tracks, isIdentical, permissionGranted } = await scanDeviceAudio({
        currentCache: localTracksRef.current,
        defaultCover,
      });

      if (!permissionGranted) {
        if (!isSilent) {
          Alert.alert(
            'Permiso denegado',
            'Necesitamos acceso a tu biblioteca de medios para buscar archivos de audio.'
          );
        }
        return [];
      }

      if (tracks.length === 0) {
        if (!isSilent) {
          Alert.alert('Escaneo Completado', 'No se encontraron archivos de audio en el dispositivo.');
        }
        if (!isSilent) setIsSourceChanging(false);
        return [];
      }

      if (isIdentical) {
        if (!isSilent) setIsSourceChanging(false);
        return tracks;
      }

      await saveLocalTracks(tracks, !isSilent);

      if (!isSilent) {
        Alert.alert(
          'Escaneo Completado',
          `Se cargaron ${tracks.length} canciones en tu biblioteca local.`
        );
      }
      return tracks;
    } catch (e) {
      console.error('[useLocalLibrary] Error al escanear audio local:', e);
      if (!isSilent) {
        Alert.alert('Error', 'Hubo un problema al escanear los archivos locales.');
      }
      return [];
    } finally {
      if (!isSilent) {
        setIsSourceChanging(false);
      }
    }
  };

  const handleImportMp3 = async (): Promise<void> => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/flac', 'audio/wav'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      setIsSourceChanging(true);

      const importedTracks: Track[] = [];
      const BATCH_SIZE = 4;

      for (let i = 0; i < res.assets.length; i += BATCH_SIZE) {
        const batch = res.assets.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (asset, idx) => {
            const meta = await extractMetadata(asset.uri);
            return {
              mediaId: `imported-${Date.now()}-${i + idx}`,
              url: asset.uri,
              title: meta.title || asset.name.replace(/\.[^/.]+$/, ''),
              artist: meta.artist || 'Archivo Importado',
              album: meta.album || 'Álbum Desconocido',
              genre: meta.genre || null,
              artworkUrl: meta.artworkUrl || defaultCover,
              lyrics: meta.lyrics || null,
              replayGain: meta.replayGain || null,
            };
          })
        );
        importedTracks.push(...results);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
      const updatedTracks = [...existingCustom, ...importedTracks];

      await saveLocalTracks(updatedTracks);
      Alert.alert(
        'Importación Exitosa',
        `Se han importado ${importedTracks.length} canción(es) a la biblioteca local.`
      );
    } catch (e) {
      console.error('Error al importar archivo MP3:', e);
      Alert.alert('Error', 'No se pudo importar el archivo MP3.');
    } finally {
      setIsSourceChanging(false);
    }
  };

  const handleResetLocal = async (): Promise<void> => {
    Alert.alert(
      'Restablecer Biblioteca',
      '¿Estás seguro de que quieres restablecer la biblioteca local? Se escaneará nuevamente la música del teléfono.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setIsSourceChanging(true);
            try {
              await AsyncStorage.removeItem('vulpis_local_tracks');
              setLocalLibraryTracks([]);
              setHasCustomLocalTracks(false);

              if (currentSourceRef.current === 'local') {
                setTracks([]);
                await TrackPlayer.clear();
              }
              await handleScanLocal({ silent: false });
            } catch (e) {
              console.error('Error al restablecer pistas locales:', e);
            } finally {
              setIsSourceChanging(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteLocalTrack = async (track: Track): Promise<void> => {
    setIsSourceChanging(true);
    try {
      // 1. Si es una pista escaneada del sistema
      const isSystemAsset =
        track.mediaId &&
        !track.mediaId.startsWith('imported-') &&
        !track.mediaId.startsWith('local-drive-') &&
        !track.mediaId.startsWith('local-track-');

      if (isSystemAsset) {
        try {
          const deleted = await MediaLibrary.deleteAssetsAsync([track.mediaId]);
          if (!deleted) {
            setIsSourceChanging(false);
            return;
          }
          console.log('[useLocalLibrary] Pista del sistema eliminada físicamente:', track.mediaId);
        } catch (mediaErr) {
          console.warn('[useLocalLibrary] Error al borrar de MediaLibrary:', mediaErr);
          Alert.alert(
            'Error de permisos',
            'No se pudo eliminar el archivo público. Asegúrate de otorgar los permisos necesarios.'
          );
          setIsSourceChanging(false);
          return;
        }
      } else if (track.url && track.url.startsWith('file://')) {
        // 2. Si es un archivo físico privado de la app
        try {
          const fileInfo = await FileSystem.getInfoAsync(track.url);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(track.url);
            console.log('[useLocalLibrary] Archivo privado borrado del almacenamiento:', track.url);
          }
        } catch (fileErr) {
          console.warn('[useLocalLibrary] Error al intentar borrar archivo físico privado:', fileErr);
        }
      }

      // 3. Detener el reproductor si la pista eliminada es la pista activa
      try {
        const active = TrackPlayer.getActiveMediaItem() as Track | null;
        if (active && active.mediaId === track.mediaId) {
          await TrackPlayer.stop();
          await TrackPlayer.clear();
          if (setActiveTrack) setActiveTrack(null);
          if (setIsPlaying) setIsPlaying(false);
        }
      } catch (playerErr) {
        console.warn('[useLocalLibrary] Error al detener reproductor:', playerErr);
      }

      // 4. Quitar del estado de la cola de reproducción
      if (playQueue && setPlayQueue) {
        const updatedQueue = playQueue.filter((t) => t.mediaId !== track.mediaId);
        setPlayQueue(updatedQueue);
      }

      // 5. Quitar de la biblioteca local (AsyncStorage y estado)
      const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
      const updatedTracks = existingCustom.filter((t) => t.mediaId !== track.mediaId);

      await saveLocalTracks(updatedTracks);

      if (showToast) {
        showToast(
          isSystemAsset
            ? 'Archivo eliminado del teléfono'
            : 'Canción eliminada de la biblioteca'
        );
      }
    } catch (e) {
      console.error('[useLocalLibrary] Error al borrar canción local:', e);
      Alert.alert('Error', 'No se pudo eliminar la canción.');
    } finally {
      setIsSourceChanging(false);
    }
  };

  const handleBatchDeleteLocalTracks = async (tracksToDelete: Track[]): Promise<void> => {
    const localTracks = tracksToDelete.filter((t) => !t.mediaId.startsWith('drive-'));
    if (localTracks.length === 0) {
      if (showToast) showToast('No hay canciones locales seleccionadas');
      return;
    }

    Alert.alert(
      'Eliminar canciones locales',
      `¿Deseas eliminar las ${localTracks.length} canciones seleccionadas del dispositivo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsSourceChanging(true);
            try {
              const systemAssetIds: string[] = [];
              const deletedMediaIds = new Set<string>();

              for (const track of localTracks) {
                const isSystemAsset =
                  track.mediaId &&
                  !track.mediaId.startsWith('imported-') &&
                  !track.mediaId.startsWith('local-drive-') &&
                  !track.mediaId.startsWith('local-track-');

                if (isSystemAsset) {
                  systemAssetIds.push(track.mediaId);
                } else if (track.url && track.url.startsWith('file://')) {
                  try {
                    const fileInfo = await FileSystem.getInfoAsync(track.url);
                    if (fileInfo.exists) {
                      await FileSystem.deleteAsync(track.url);
                    }
                  } catch (fileErr) {
                    console.warn('[useLocalLibrary] Error al borrar archivo privado:', fileErr);
                  }
                }
                deletedMediaIds.add(track.mediaId);
              }

              if (systemAssetIds.length > 0) {
                try {
                  await MediaLibrary.deleteAssetsAsync(systemAssetIds);
                } catch (mediaErr) {
                  console.warn('[useLocalLibrary] Error al borrar lote de MediaLibrary:', mediaErr);
                }
              }

              // Detener si la pista activa fue eliminada
              try {
                const active = TrackPlayer.getActiveMediaItem() as Track | null;
                if (active && deletedMediaIds.has(active.mediaId)) {
                  await TrackPlayer.stop();
                  await TrackPlayer.clear();
                  if (setActiveTrack) setActiveTrack(null);
                  if (setIsPlaying) setIsPlaying(false);
                }
              } catch (playerErr) {
                console.warn('[useLocalLibrary] Error al detener reproductor:', playerErr);
              }

              // Quitar de la cola
              if (playQueue && setPlayQueue) {
                setPlayQueue(playQueue.filter((t) => !deletedMediaIds.has(t.mediaId)));
              }

              // Quitar de la biblioteca local
              const existingCustom = hasCustomLocalTracks ? localLibraryTracks : [];
              const updatedTracks = existingCustom.filter((t) => !deletedMediaIds.has(t.mediaId));
              await saveLocalTracks(updatedTracks);

              if (showToast) {
                showToast(`¡${deletedMediaIds.size} canción(es) eliminada(s)!`);
              }
            } catch (e) {
              console.error('[useLocalLibrary] Error al borrar lote de canciones locales:', e);
              Alert.alert('Error', 'No se pudieron eliminar algunas canciones del dispositivo.');
            } finally {
              setIsSourceChanging(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateLocalTrackMetadata = async (
    track: Track,
    newTags: { title: string; artist: string; album: string; genre: string }
  ): Promise<boolean> => {
    try {
      const updatedTrack: Track = {
        ...track,
        title: newTags.title,
        artist: newTags.artist,
        album: newTags.album || null,
        genre: newTags.genre || null,
      };

      // 1. Intentar escribir etiqueta física ID3v1 si es un archivo local en disco
      if (track.url && track.url.startsWith('file://')) {
        await writePhysicalId3v1Tag(track.url, {
          title: newTags.title,
          artist: newTags.artist,
          album: newTags.album,
          genre: newTags.genre,
        });
      }

      // 2. Actualizar en la lista de pistas locales
      const updatedList = localLibraryTracks.map((t) =>
        t.mediaId === track.mediaId ? updatedTrack : t
      );
      await saveLocalTracks(updatedList, false);

      // 3. Actualizar la cola si la pista está presente
      if (playQueue && setPlayQueue) {
        const updatedQueue = playQueue.map((t) =>
          t.mediaId === track.mediaId ? updatedTrack : t
        );
        setPlayQueue(updatedQueue);
      }

      // 4. Actualizar la pista activa si coincide
      if (setActiveTrack) {
        const active = TrackPlayer.getActiveMediaItem() as Track | null;
        if (active && active.mediaId === track.mediaId) {
          setActiveTrack(updatedTrack);
        }
      }

      if (showToast) {
        showToast('Etiquetas actualizadas con éxito');
      }

      return true;
    } catch (err) {
      console.error('[useLocalLibrary] Error actualizando etiquetas:', err);
      Alert.alert('Error', 'No se pudieron actualizar las etiquetas de la canción.');
      return false;
    }
  };

  const handleUpdateLocalTrackArtwork = async (
    track: Track,
    newArtworkUrl: string
  ): Promise<boolean> => {
    try {
      const updatedTrack: Track = {
        ...track,
        artworkUrl: newArtworkUrl,
      };

      // 1. Actualizar en la lista de pistas locales
      const updatedList = localLibraryTracks.map((t) =>
        t.mediaId === track.mediaId ? updatedTrack : t
      );
      await saveLocalTracks(updatedList, false);

      // 2. Actualizar la cola si la pista está presente
      if (playQueue && setPlayQueue) {
        const updatedQueue = playQueue.map((t) =>
          t.mediaId === track.mediaId ? updatedTrack : t
        );
        setPlayQueue(updatedQueue);
      }

      // 3. Actualizar la pista activa si coincide
      if (setActiveTrack) {
        const active = TrackPlayer.getActiveMediaItem() as Track | null;
        if (active && active.mediaId === track.mediaId) {
          setActiveTrack(updatedTrack);
        }
      }

      if (showToast) {
        showToast('Carátula actualizada con éxito');
      }

      return true;
    } catch (err) {
      console.error('[useLocalLibrary] Error actualizando carátula:', err);
      Alert.alert('Error', 'No se pudo actualizar la carátula de la canción.');
      return false;
    }
  };

  return {
    localLibraryTracks,
    setLocalLibraryTracks,
    hasCustomLocalTracks,
    setHasCustomLocalTracks,
    saveLocalTracks,
    handleScanLocal,
    handleImportMp3,
    handleResetLocal,
    handleDeleteLocalTrack,
    handleBatchDeleteLocalTracks,
    handleUpdateLocalTrackMetadata,
    handleUpdateLocalTrackArtwork,
  };
}
