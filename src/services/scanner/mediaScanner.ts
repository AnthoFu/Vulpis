import * as MediaLibrary from 'expo-media-library/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractMetadata } from '../../utils/metadata';
import { isExcludedAudio } from '../../utils/audioFilter';
import { Track, createTrack } from '../../models/Track';

/**
 * Resultado del proceso de escaneo de audio local.
 */
export interface ScanResult {
  /** Lista consolidada de pistas con metadatos procesados */
  tracks: Track[];
  /** Indica si la biblioteca es idéntica a la que ya existía en memoria */
  isIdentical: boolean;
  /** Si el usuario concedió los permisos necesarios de lectura multimedia */
  permissionGranted: boolean;
}

/**
 * Opciones para el escaneo de audio.
 */
export interface ScanDeviceAudioOptions {
  currentCache?: Track[];
  defaultCover: string;
}

/**
 * Escaneo ultra-optimizado con caché incremental y procesamiento por lotes no bloqueante
 * de los archivos de audio del almacenamiento local del dispositivo.
 *
 * Utiliza `expo-media-library` para consultar archivos del sistema y aplica el filtro
 * inteligente `isExcludedAudio` para descartar notas de voz (WhatsApp, Telegram, etc.).
 */
export async function scanDeviceAudio({
  currentCache = [],
  defaultCover,
}: ScanDeviceAudioOptions): Promise<ScanResult> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    return { tracks: [], isIdentical: false, permissionGranted: false };
  }

  // 1. Obtener todas las pistas de audio disponibles en el almacenamiento
  let allAssets: MediaLibrary.Asset[] = [];
  let hasNextPage = true;
  let endCursor: string | undefined = undefined;

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
  let cache: Track[] = currentCache;
  if (!cache || cache.length === 0) {
    try {
      const stored = await AsyncStorage.getItem('vulpis_local_tracks');
      if (stored) {
        cache = JSON.parse(stored) || [];
      }
    } catch (e) {
      // Ignorar error de lectura de caché
    }
  }

  const cachedMap = new Map<string, Track>();
  const customTracks: Track[] = []; // Conservar pistas importadas manualmente o de Google Drive

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
  const newTracks: Track[] = [];
  const pendingAssetsToExtract: Array<{ asset: MediaLibrary.Asset; index: number }> = [];

  for (let i = 0; i < assetsList.length; i++) {
    const asset = assetsList[i];
    const cached = cachedMap.get(asset.uri) || cachedMap.get(asset.id);

    if (cached && cached.title) {
      // Reutilizar de inmediato sin reprocesar ID3
      newTracks.push({
        ...cached,
        mediaId: asset.id || cached.mediaId,
        url: asset.uri,
        duration: asset.duration || cached.duration || 0,
        addedAt:
          cached.addedAt ||
          ((asset as any).modificationTime
            ? (asset as any).modificationTime * 1000
            : asset.creationTime
            ? asset.creationTime * 1000
            : Date.now()),
      });
    } else {
      // Nueva pista detectada para extracción de metadatos
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
          return createTrack({
            mediaId: asset.id || `local-scanned-${index}-${Date.now()}`,
            url: asset.uri,
            title: meta?.title || asset.filename.replace(/\.[^/.]+$/, ''),
            artist: meta?.artist || 'Audio Local',
            album: meta?.album || 'Álbum Desconocido',
            genre: meta?.genre || null,
            artworkUrl: meta?.artworkUrl || defaultCover,
            lyrics: meta?.lyrics || null,
            duration: asset.duration || 0,
            replayGain: meta?.replayGain || null,
            addedAt:
              (asset as any).modificationTime
                ? (asset as any).modificationTime * 1000
                : asset.creationTime
                ? asset.creationTime * 1000
                : Date.now(),
          });
        })
      );
      newTracks.push(...results);

      // Ceder el hilo principal para mantener 60/120 FPS fluidos
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
