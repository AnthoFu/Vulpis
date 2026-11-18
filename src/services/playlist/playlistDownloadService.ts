/**
 * Servicio para la descarga por lotes y sincronización offline de Playlists completas.
 * Permite descargar todas las pistas remotas de Google Drive pertenecientes a una lista
 * de reproducción con un solo toque, extrayendo metadatos ID3 y garantizando disponibilidad sin conexión.
 */

import { Playlist } from '../../models/Playlist';
import { Track } from '../../models/Track';
import { downloadDriveFile } from '../drive/driveDownload';
import { extractMetadata } from '../../utils/metadata';

export interface PlaylistDownloadProgress {
  /** ID de la playlist que se está descargando */
  playlistId?: string;
  /** Total de pistas de la playlist a procesar */
  total: number;
  /** Cantidad de canciones descargadas o verificadas con éxito */
  completed: number;
  /** Título de la pista que se está descargando en este momento */
  currentTrackTitle?: string;
  /** Cantidad de canciones que fallaron durante la descarga */
  failed: number;
  /** Indica si la operación de descarga está en curso */
  isDownloading: boolean;
}

export interface PlaylistDownloadResult {
  /** Indica si todas las pistas se completaron sin errores críticos */
  success: boolean;
  /** Total de pistas en la lista de reproducción */
  totalTracks: number;
  /** Canciones descargadas exitosamente desde la nube */
  downloadedCount: number;
  /** Canciones que ya estaban descargadas previamente o eran locales */
  skippedCount: number;
  /** Canciones cuya descarga falló por error de red o permisos */
  failedCount: number;
  /** Instancia actualizada de la playlist con URIs locales 'file://...' */
  updatedPlaylist: Playlist;
}

export interface PlaylistDownloadStats {
  /** Total de pistas */
  total: number;
  /** Pistas locales o ya presentes en la caché */
  localCount: number;
  /** Pistas remotas de Drive pendientes de descarga */
  drivePendingCount: number;
  /** Indica si el 100% de la playlist está disponible para reproducir offline */
  isFullyOffline: boolean;
}

/**
 * Calcula las estadísticas de disponibilidad offline de una lista de reproducción.
 *
 * @param playlist Lista de reproducción a evaluar
 * @returns Estadísticas de pistas locales vs remotas
 */
export function getPlaylistDownloadStats(playlist?: Playlist | null): PlaylistDownloadStats {
  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
    return {
      total: 0,
      localCount: 0,
      drivePendingCount: 0,
      isFullyOffline: false,
    };
  }

  const total = playlist.tracks.length;
  let localCount = 0;
  let drivePendingCount = 0;

  for (const track of playlist.tracks) {
    const isLocalUrl = track.url && track.url.startsWith('file://');
    const isDriveTrack = track.mediaId && track.mediaId.startsWith('drive-');

    if (isLocalUrl || !isDriveTrack) {
      localCount++;
    } else {
      drivePendingCount++;
    }
  }

  return {
    total,
    localCount,
    drivePendingCount,
    isFullyOffline: total > 0 && drivePendingCount === 0,
  };
}

/**
 * Descarga secuencialmente todas las canciones remotas de Google Drive de una playlist,
 * extrayendo metadatos ID3 y retornando la playlist actualizada lista para persistir.
 *
 * @param playlist Lista de reproducción seleccionada
 * @param token Token OAuth de acceso a Google Drive
 * @param onProgress Callback de reporte de progreso en tiempo real
 * @returns Resultado detallado de la descarga y lista actualizada
 */
export async function downloadPlaylistOffline(
  playlist: Playlist,
  token: string,
  onProgress?: (progress: PlaylistDownloadProgress) => void
): Promise<PlaylistDownloadResult> {
  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
    return {
      success: true,
      totalTracks: 0,
      downloadedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      updatedPlaylist: playlist,
    };
  }

  if (!token) {
    throw new Error('No hay sesión activa de Google Drive');
  }

  const tracks = playlist.tracks;
  const total = tracks.length;
  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const updatedTracks: Track[] = [];

  for (let i = 0; i < total; i++) {
    const track = tracks[i];
    const isLocalUrl = track.url && track.url.startsWith('file://');
    const isDriveTrack = track.mediaId && track.mediaId.startsWith('drive-');

    // 1. Si ya es una pista local o no es de Google Drive, conservarla sin re-descargar
    if (isLocalUrl || !isDriveTrack) {
      skippedCount++;
      updatedTracks.push(track);
      if (onProgress) {
        onProgress({
          playlistId: playlist.id,
          total,
          completed: downloadedCount + skippedCount,
          currentTrackTitle: track.title,
          failed: failedCount,
          isDownloading: true,
        });
      }
      continue;
    }

    // 2. Si es una pista remota de Google Drive, descargarla a la caché
    const fileId = track.mediaId.replace(/^drive-/, '');
    if (onProgress) {
      onProgress({
        playlistId: playlist.id,
        total,
        completed: downloadedCount + skippedCount,
        currentTrackTitle: track.title,
        failed: failedCount,
        isDownloading: true,
      });
    }

    try {
      const localUri = await downloadDriveFile(fileId, track.title, token);
      if (localUri) {
        // Extraer metadatos ID3 reales del archivo físico recién descargado
        let enrichedTrack = { ...track, url: localUri };
        try {
          const meta = await extractMetadata(localUri);
          const enrichedArtist =
            meta.artist && meta.artist !== 'Desconocido'
              ? meta.artist
              : track.artist !== 'Nube Privada (Drive)' && track.artist !== 'Google Drive'
              ? track.artist
              : 'Artista desconocido';

          enrichedTrack = {
            ...track,
            url: localUri,
            title: meta.title || track.title,
            artist: enrichedArtist,
            album: meta.album || track.album || 'Nube Privada',
            artworkUrl: meta.artworkUrl || track.artworkUrl,
            genre: meta.genre || track.genre,
            lyrics: meta.lyrics || track.lyrics,
            replayGain: meta.replayGain || track.replayGain,
          };
        } catch (metaErr) {
          console.warn('[PlaylistDownload] Falló extracción de metadatos en pista descargada:', metaErr);
        }

        updatedTracks.push(enrichedTrack);
        downloadedCount++;
      } else {
        // Falló la descarga del archivo específico
        failedCount++;
        updatedTracks.push(track);
      }
    } catch (downloadErr) {
      console.error(`[PlaylistDownload] Error descargando pista "${track.title}":`, downloadErr);
      failedCount++;
      updatedTracks.push(track);
    }

    if (onProgress) {
      onProgress({
        playlistId: playlist.id,
        total,
        completed: downloadedCount + skippedCount,
        currentTrackTitle: track.title,
        failed: failedCount,
        isDownloading: i < total - 1,
      });
    }
  }

  const updatedPlaylist: Playlist = {
    ...playlist,
    tracks: updatedTracks,
    updatedAt: Date.now(),
  };

  return {
    success: failedCount === 0,
    totalTracks: total,
    downloadedCount,
    skippedCount,
    failedCount,
    updatedPlaylist,
  };
}
