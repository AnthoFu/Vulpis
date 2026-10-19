import { useEffect } from 'react';
import TrackPlayer, { PlayerCommand, Event } from '@rntp/player';
import { getStoredToken } from '../utils/drive';
import { isExcludedAudio } from '../utils/audioFilter';

/**
 * Hook para la inicialización y restauración del estado de TrackPlayer.
 * Configura capacidades nativas, carga pistas locales guardadas, restaura la cola
 * y posición previa del reproductor, e inicia el escaneo automático en segundo plano.
 */
export default function usePlayerInitializer({
  setLocalLibraryTracks,
  setHasCustomLocalTracks,
  setTracks,
  setCurrentSource,
  setPlayQueue,
  setProgress,
  setIsPlayerInitialized,
  loadStoredLocalTracks,
  loadPlayerState,
  handleScanLocal,
}) {
  useEffect(() => {
    let isMounted = true;
    let sub1, sub2, sub3;

    async function init() {
      try {
        console.log('[usePlayerInitializer] Inicializando TrackPlayer...');
        try {
          await TrackPlayer.setupPlayer({});
        } catch (e) {
          console.log('[usePlayerInitializer] Player ya estaba configurado, ignorando error:', e.message);
        }

        console.log('[usePlayerInitializer] Configurando comandos/capacidades del reproductor...');
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
          ],
        });

        console.log('[usePlayerInitializer] Configurando pistas en la cola del reproductor...');

        // Cargar pistas locales personalizadas del almacenamiento si existen
        const initialTracks = await loadStoredLocalTracks();
        if (isMounted && initialTracks.length > 0) {
          setLocalLibraryTracks(initialTracks);
          setHasCustomLocalTracks(true);
          setTracks(initialTracks);
        }

        // Cargar el estado guardado del reproductor si existe
        const savedState = await loadPlayerState();

        // Verificar si tenemos un token guardado para Drive
        let hasDriveToken = false;
        try {
          const token = await getStoredToken();
          if (token) {
            hasDriveToken = true;
          }
        } catch (tokenErr) {
          console.error('[usePlayerInitializer] Error al verificar el token de Drive:', tokenErr);
        }

        await TrackPlayer.clear();

        if (savedState && savedState.playQueue && savedState.playQueue.length > 0) {
          console.log('[usePlayerInitializer] Restaurando el estado guardado del reproductor...');

          let sourceToRestore = savedState.currentSource || 'local';
          if (sourceToRestore === 'private' && !hasDriveToken) {
            console.log(
              '[usePlayerInitializer] La fuente guardada es privada pero no se encontró ningún token, volviendo a local'
            );
            sourceToRestore = 'local';
          }

          // Filtrar cualquier audio de WhatsApp o no deseado que hubiera quedado en la cola guardada
          const restoredQueue = savedState.playQueue.filter((t) => !isExcludedAudio(t));
          const effectiveQueue = restoredQueue.length > 0 ? restoredQueue : initialTracks;

          if (isMounted) {
            setCurrentSource(sourceToRestore);

            if (sourceToRestore === 'private') {
              setPlayQueue(effectiveQueue);
              setTracks(savedState.tracksList || effectiveQueue);
            } else {
              setPlayQueue(effectiveQueue);
              setTracks(initialTracks);
            }
          }

          if (effectiveQueue.length > 0) {
            await TrackPlayer.setMediaItems(effectiveQueue);

            // Buscar el índice de la pista activa
            let activeIndex = 0;
            if (savedState.activeTrackId) {
              const idx = effectiveQueue.findIndex((t) => t.mediaId === savedState.activeTrackId);
              if (idx !== -1) {
                activeIndex = idx;
              }
            }
            await TrackPlayer.skipToIndex(activeIndex);

            if (savedState.progressPosition && savedState.progressPosition > 0) {
              console.log(`[usePlayerInitializer] Buscando posición guardada: ${savedState.progressPosition}`);
              await TrackPlayer.seekTo(savedState.progressPosition);
              if (isMounted) {
                const activeTrackItem = effectiveQueue[activeIndex];
                setProgress({
                  position: savedState.progressPosition,
                  duration: activeTrackItem ? activeTrackItem.duration || 0 : 0,
                });
              }
            }
          }
        } else if (initialTracks.length > 0) {
          // Configuración predeterminada con pistas almacenadas
          await TrackPlayer.setMediaItems(initialTracks);
          await TrackPlayer.skipToIndex(0);
          if (isMounted) {
            setPlayQueue(initialTracks);
          }
        }

        // Ejecución de escaneo automático en segundo plano al entrar a la aplicación
        setTimeout(() => {
          console.log('[usePlayerInitializer] Iniciando escaneo automático de canciones locales...');
          handleScanLocal({ silent: true }).catch((err) => {
            console.log('[usePlayerInitializer] Error en escaneo automático inicial:', err);
          });
        }, 300);

        console.log('[usePlayerInitializer] ¡Configuración de TrackPlayer completada exitosamente!');

        sub1 = TrackPlayer.addEventListener(Event.MediaItemTransition, (_event) => {});
        sub2 = TrackPlayer.addEventListener(Event.IsPlayingChanged, (_event) => {});
        sub3 = TrackPlayer.addEventListener(Event.PlaybackStateChanged, (_event) => {});

        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      } catch (err) {
        console.error('[usePlayerInitializer] Error crítico de configuración del reproductor:', err);
        if (isMounted) {
          setIsPlayerInitialized(true);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (sub1) sub1.remove();
      if (sub2) sub2.remove();
      if (sub3) sub3.remove();
    };
  }, []);
}
