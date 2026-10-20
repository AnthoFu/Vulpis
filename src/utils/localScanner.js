import * as MediaLibrary from 'expo-media-library/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractMetadata } from './metadata';
import { isExcludedAudio } from './audioFilter';

/**
 * Escaneo ultra-optimizado con caché incremental y procesamiento por lotes no bloqueante
 * de los archivos de audio del almacenamiento local del dispositivo.
 */
export async function scanDeviceAudio({ currentCache = [], defaultCover }) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    return { tracks: [], isIdentical: false, permissionGranted: false };
  }

  // 1. Obtener todas las pistas de audio disponibles en el almacenamiento
  let allAssets = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage && allAssets.length < 2000) {
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: [MediaLibrary.MediaType.audio],
      first: 300,
      after: endCursor,
    });

    if (media.assets && media.assets.length > 0) {
      allAssets.push(...media.assets);
    }

    hasNextPage = media.hasNextPage;
    endCursor = media.endCursor;
    if (!hasNextPage) break;
  }

  // 2. Filtrar y excluir notas de voz, audios de mensajería (WhatsApp, Telegram) y grabadoras
  const assetsList = allAssets.filter((asset) => !isExcludedAudio(asset));

  // 3. Construir mapa de caché de la biblioteca existente para reutilizar metadatos en 0ms
  let cache = currentCache;
  if (!cache || cache.length === 0) {
    try {
      const stored = await AsyncStorage.getItem('vulpis_local_tracks');
      if (stored) {
        cache = JSON.parse(stored) || [];
      }
    } catch (e) {
      // Ignorar
    }
  }

  const cachedMap = new Map();
  const customTracks = []; // Conservar pistas importadas manualmente o de Google Drive

  for (const track of cache) {
    if (
      track.mediaId &&
      (track.mediaId.startsWith('imported-') || track.mediaId.startsWith('local-drive-'))
    ) {
      customTracks.push(track);
    }
    if (track.url) cachedMap.set(track.url, track);
    if (track.mediaId) cachedMap.set(track.mediaId, track);
  }

  if (assetsList.length === 0 && customTracks.length === 0) {
    return { tracks: [], isIdentical: false, permissionGranted: true };
  }

  // 4. Identificar qué pistas ya tienen metadatos cacheados y cuáles son nuevas
  const newTracks = [];
  const pendingAssetsToExtract = [];

  for (let i = 0; i < assetsList.length; i++) {
    const asset = assetsList[i];
    const cached = cachedMap.get(asset.uri) || cachedMap.get(asset.id);

    if (cached && cached.title) {
      // Reutilizar de inmediato
      newTracks.push({
        ...cached,
        mediaId: asset.id || cached.mediaId,
        url: asset.uri,
        duration: asset.duration || cached.duration,
      });
    } else {
      // Nueva pista detectada para extraer metadatos
      pendingAssetsToExtract.push({ asset, index: i });
    }
  }

  // 5. Procesar únicamente las canciones nuevas en pequeños lotes concurrentes (4 a la vez)
  if (pendingAssetsToExtract.length > 0) {
    const BATCH_SIZE = 4;
    for (let i = 0; i < pendingAssetsToExtract.length; i += BATCH_SIZE) {
      const batch = pendingAssetsToExtract.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ asset, index }) => {
          const meta = await extractMetadata(asset.uri);
          return {
            mediaId: asset.id || `local-scanned-${index}-${Date.now()}`,
            url: asset.uri,
            title: meta.title || asset.filename.replace(/\.[^/.]+$/, ''),
            artist: meta.artist || 'Audio Local',
            album: meta.album || 'Álbum Desconocido',
            genre: meta.genre || null,
            artworkUrl: meta.artworkUrl || defaultCover,
            lyrics: meta.lyrics || null,
            duration: asset.duration || 0,
            replayGain: meta.replayGain || null,
          };
        })
      );
      newTracks.push(...results);

      // Ceder el hilo principal para mantener 120/60 FPS fluidos
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // 6. Unir pistas escaneadas con pistas importadas/drive
  const combinedTracks = [...customTracks, ...newTracks];

  // 7. Comprobar si hubo cambios reales con respecto a lo que ya está en memoria
  const isIdentical =
    cache.length === combinedTracks.length &&
    cache.every(
      (t, idx) =>
        t.mediaId === combinedTracks[idx]?.mediaId &&
        t.url === combinedTracks[idx]?.url &&
        t.title === combinedTracks[idx]?.title
    );

  return { tracks: combinedTracks, isIdentical, permissionGranted: true };
}
