import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWebStoredToken,
  saveWebStoredToken,
  clearWebToken,
  fetchWebDriveMp3Files,
  signInWebWithGoogle,
  getWebGoogleConfig,
  saveWebGoogleConfig,
} from '../services/webDrive';
import webPlayer from '../services/webAudioPlayer';

const DEFAULT_COVER = '/assets/default-cover.jpg';

export default function useWebDrive() {
  const [token, setToken] = useState(() => getWebStoredToken());
  const [driveTracks, setDriveTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folderName, setFolderName] = useState('Vulpis');

  // Configurar el getter del token en el reproductor de audio
  useEffect(() => {
    webPlayer.setDriveTokenGetter(() => token);
  }, [token]);

  const loadTracks = useCallback(async (accessToken) => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const files = await fetchWebDriveMp3Files(accessToken);
      const mapped = files.map((file, idx) => ({
        id: `drive-${file.id}`,
        mediaId: `drive-${file.id}`,
        driveFileId: file.id,
        title: file.name.replace(/\.mp3$/i, ''),
        artist: 'Google Drive',
        album: 'Nube Privada',
        artwork: null,
        size: file.size ? `${(parseInt(file.size, 10) / (1024 * 1024)).toFixed(1)} MB` : '',
        source: 'drive',
        index: idx,
      }));
      setDriveTracks(mapped);
    } catch (err) {
      console.error('[useWebDrive] Error al cargar pistas:', err);
      if (err.message === 'AUTH_EXPIRED') {
        setToken(null);
        setError('Tu sesión de Google Drive ha expirado. Por favor, conéctate de nuevo.');
      } else {
        setError(err.message || 'Error al conectar con Google Drive.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar pistas al iniciar si ya hay un token guardado
  useEffect(() => {
    if (token) {
      loadTracks(token);
    }
  }, [token, loadTracks]);

  const connectWithGoogle = useCallback(async (customClientId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (customClientId) {
        saveWebGoogleConfig(customClientId);
      }
      const accessToken = await signInWebWithGoogle(customClientId);
      setToken(accessToken);
      await loadTracks(accessToken);
      return true;
    } catch (err) {
      console.error('[useWebDrive] Error de conexión OAuth:', err);
      setError(err.message || 'Error al conectar con Google Drive.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadTracks]);

  const connectWithManualToken = useCallback(async (manualToken) => {
    if (!manualToken || !manualToken.trim()) return false;
    setIsLoading(true);
    setError(null);
    try {
      const cleaned = manualToken.trim();
      saveWebStoredToken(cleaned, 3600);
      setToken(cleaned);
      await loadTracks(cleaned);
      return true;
    } catch (err) {
      setError(err.message || 'El token ingresado no es válido.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadTracks]);

  const disconnectDrive = useCallback(() => {
    clearWebToken();
    setToken(null);
    setDriveTracks([]);
    setError(null);
  }, []);

  const refreshTracks = useCallback(() => {
    if (token) {
      loadTracks(token);
    }
  }, [token, loadTracks]);

  return {
    isDriveConnected: !!token,
    token,
    driveTracks,
    isLoading,
    error,
    folderName,
    connectWithGoogle,
    connectWithManualToken,
    disconnectDrive,
    refreshTracks,
  };
}
