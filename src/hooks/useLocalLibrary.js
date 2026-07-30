import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import TrackPlayer from '@rntp/player';
import { extractMetadata } from '../utils/metadata';
import { localTracks } from '../constants/tracks';

export default function useLocalLibrary({
  currentSource,
  setTracks,
  defaultCover,
  setIsSourceChanging,
}) {
  const [localLibraryTracks, setLocalLibraryTracks] = useState(localTracks);
  const [hasCustomLocalTracks, setHasCustomLocalTracks] = useState(false);

  const currentSourceRef = useRef(currentSource);
  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);

  const saveLocalTracks = async (newTracksList) => {
    setLocalLibraryTracks(newTracksList);
    setHasCustomLocalTracks(true);
    await AsyncStorage.setItem('vulpis_local_tracks', JSON.stringify(newTracksList));

    if (currentSourceRef.current === 'local') {
      setTracks(newTracksList);

      try {
        const active = TrackPlayer.getActiveMediaItem();
        await TrackPlayer.clear();
        await TrackPlayer.setMediaItems(newTracksList);

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
  };

  const handleScanLocal = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu biblioteca de medios para buscar archivos de audio.'
        );
        return;
      }

      setIsSourceChanging(true);

      let media = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.audio],
        first: 100,
      });

      const assetsList = media.assets.filter(
        (asset) => asset.filename && asset.filename.toLowerCase().endsWith('.mp3')
      );

      if (assetsList.length === 0) {
        Alert.alert('Escaneo Completado', 'No se encontraron archivos .mp3 en el dispositivo.');
        setIsSourceChanging(false);
        return;
      }

      const newTracks = [];
      for (let i = 0; i < assetsList.length; i++) {
        const asset = assetsList[i];
        const meta = await extractMetadata(asset.uri);
        newTracks.push({
          mediaId: asset.id || `local-scanned-${i}-${Date.now()}`,
          url: asset.uri,
          title: meta.title || asset.filename.replace(/\.mp3$/i, ''),
          artist: meta.artist || 'Audio Escaneado',
          artworkUrl: meta.artworkUrl || defaultCover,
        });
      }

      await saveLocalTracks(newTracks);
      Alert.alert(
        'Escaneo Completado',
        `Se encontraron y cargaron ${newTracks.length} archivos .mp3 en tu biblioteca local.`
      );
    } catch (e) {
      console.error('Error al escanear audio local:', e);
      Alert.alert('Error', 'Hubo un problema al escanear los archivos locales.');
    } finally {
      setIsSourceChanging(false);
    }
  };

  const handleImportMp3 = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (res.canceled) return;

      setIsSourceChanging(true);

      const importedTracks = [];
      for (let i = 0; i < res.assets.length; i++) {
        const asset = res.assets[i];
        const meta = await extractMetadata(asset.uri);
        importedTracks.push({
          mediaId: `imported-${Date.now()}-${i}`,
          url: asset.uri,
          title: meta.title || asset.name.replace(/\.mp3$/i, ''),
          artist: meta.artist || 'Archivo Importado',
          artworkUrl: meta.artworkUrl || defaultCover,
        });
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

  const handleResetLocal = async () => {
    Alert.alert(
      'Restablecer Biblioteca',
      '¿Estás seguro de que quieres restablecer la biblioteca local? Esto eliminará tus canciones importadas/escaneadas y volverá a las canciones de prueba.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setIsSourceChanging(true);
            try {
              await AsyncStorage.removeItem('vulpis_local_tracks');
              setLocalLibraryTracks(localTracks);
              setHasCustomLocalTracks(false);

              if (currentSourceRef.current === 'local') {
                setTracks(localTracks);
                await TrackPlayer.clear();
                await TrackPlayer.setMediaItems(localTracks);
                await TrackPlayer.skipToIndex(0);
              }
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

  return {
    localLibraryTracks,
    setLocalLibraryTracks,
    hasCustomLocalTracks,
    setHasCustomLocalTracks,
    saveLocalTracks,
    handleScanLocal,
    handleImportMp3,
    handleResetLocal,
  };
}
