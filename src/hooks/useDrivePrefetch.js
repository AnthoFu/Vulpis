import { useEffect } from 'react';
import TrackPlayer, { RepeatMode } from '@rntp/player';
import * as FileSystem from 'expo-file-system/legacy';
import { getStoredToken } from '../services/drive';

/**
 * Hook para la precarga y almacenamiento en caché en segundo plano
 * de la siguiente pista proveniente de Google Drive.
 */
export default function useDrivePrefetch({
  activeTrack,
  isPlayerInitialized,
  setPlayQueue,
  setTracks,
  downloadDriveFile,
}) {
  useEffect(() => {
    if (!isPlayerInitialized) return;
    if (!activeTrack) return;

    let isMounted = true;

    async function prefetchNextTrack() {
      try {
        const activeIndex = TrackPlayer.getActiveMediaItemIndex();
        if (activeIndex === null || activeIndex === -1) return;

        const currentQueue = TrackPlayer.getQueue();
        if (!currentQueue || currentQueue.length <= 1) return;

        // Calcular el siguiente índice
        let nextIndex = activeIndex + 1;
        if (nextIndex >= currentQueue.length) {
          // Si la repetición de cola está activada, volver a 0
          const repeatMode = TrackPlayer.getRepeatMode();
          if (repeatMode === RepeatMode.Queue) {
            nextIndex = 0;
          } else {
            return; // No hay siguiente pista
          }
        }

        const nextTrack = currentQueue[nextIndex];
        if (!nextTrack) return;

        // Verificar si la siguiente pista es de Drive y aún no está en caché
        if (nextTrack.mediaId.startsWith('drive-') && !nextTrack.url.startsWith('file://')) {
          const fileId = nextTrack.mediaId.replace('drive-', '');

          // Verificar si el archivo ya está en caché (para evitar solicitar token o iniciar la descarga si ya existe)
          const localUri = FileSystem.cacheDirectory + `${fileId}.mp3`;
          const fileInfo = await FileSystem.getInfoAsync(localUri);

          if (fileInfo.exists) {
            console.log(
              `[Buffering] La siguiente pista ya está guardada en caché local en: ${localUri}. Actualizando cola...`
            );
            const updatedTrack = { ...nextTrack, url: localUri };

            if (isMounted) {
              // Actualizar la cola nativa
              const latestQueue = TrackPlayer.getQueue();
              if (
                latestQueue &&
                nextIndex < latestQueue.length &&
                latestQueue[nextIndex].mediaId === nextTrack.mediaId
              ) {
                await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
              }
              // Actualizar el estado
              setPlayQueue((prev) => {
                const newQueue = [...prev];
                if (nextIndex < newQueue.length && newQueue[nextIndex].mediaId === nextTrack.mediaId) {
                  newQueue[nextIndex] = updatedTrack;
                }
                return newQueue;
              });
              setTracks((prev) => prev.map((t) => (t.mediaId === nextTrack.mediaId ? updatedTrack : t)));
            }
            return;
          }

          // De lo contrario, necesitamos descargarlo
          const token = await getStoredToken();
          if (!token) return;

          console.log(`[Buffering] Iniciando predescarga en segundo plano para: ${nextTrack.title}`);
          const downloadedUri = await downloadDriveFile(fileId, nextTrack.title, token);

          if (downloadedUri && isMounted) {
            console.log(`[Buffering] Predescarga en segundo plano finalizada: ${nextTrack.title}`);
            const updatedTrack = { ...nextTrack, url: downloadedUri };

            // Actualizar la cola nativa
            const latestQueue = TrackPlayer.getQueue();
            if (
              latestQueue &&
              nextIndex < latestQueue.length &&
              latestQueue[nextIndex].mediaId === nextTrack.mediaId
            ) {
              await TrackPlayer.replaceMediaItem(nextIndex, updatedTrack);
            }

            // Actualizar el estado
            setPlayQueue((prev) => {
              const newQueue = [...prev];
              if (nextIndex < newQueue.length && newQueue[nextIndex].mediaId === nextTrack.mediaId) {
                newQueue[nextIndex] = updatedTrack;
              }
              return newQueue;
            });
            setTracks((prev) => prev.map((t) => (t.mediaId === nextTrack.mediaId ? updatedTrack : t)));
          }
        }
      } catch (err) {
        console.error('[Buffering] Error durante la predescarga:', err);
      }
    }

    prefetchNextTrack();

    return () => {
      isMounted = false;
    };
  }, [activeTrack, isPlayerInitialized, setPlayQueue, setTracks, downloadDriveFile]);
}
