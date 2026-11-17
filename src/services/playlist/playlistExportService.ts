import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Playlist } from '../../models/Playlist';
import { Track } from '../../models/Track';
import {
  exportPlaylistToJson,
  exportPlaylistToM3u,
  parsePlaylistFromJson,
  parsePlaylistFromM3u,
  sanitizeFileName,
} from '../../utils/playlistIO';

export type PlaylistExportFormat = 'm3u' | 'json';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface ImportResult {
  name: string;
  tracks: Track[];
}

/**
 * Exporta una lista de reproducción a formato .m3u o .json y la comparte a través
 * del diálogo nativo del sistema (Android/iOS) o descarga directa en navegador (Web).
 */
export async function exportPlaylistFile(
  playlist: Playlist,
  format: PlaylistExportFormat
): Promise<ExportResult> {
  if (!playlist) {
    return { success: false, error: 'Playlist no válida' };
  }

  const isM3u = format === 'm3u';
  const content = isM3u ? exportPlaylistToM3u(playlist) : exportPlaylistToJson(playlist);
  const ext = isM3u ? 'm3u' : 'json';
  const mimeType = isM3u ? 'audio/x-mpegurl' : 'application/json';
  const fileName = `${sanitizeFileName(playlist.name)}.${ext}`;

  // Entorno Web: Descarga directa mediante Blob y elemento ancla
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: any) {
      console.error('[PlaylistExportService] Error al exportar en web:', err);
      return { success: false, error: err.message || 'Error en descarga web' };
    }
  }

  // Entorno Móvil Nativo (Android / iOS)
  try {
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Exportar playlist: ${playlist.name}`,
        UTI: isM3u ? 'public.m3u-playlist' : 'public.json',
      });
      return { success: true, filePath: fileUri };
    } else {
      return {
        success: false,
        error: 'El servicio de compartir no está disponible en este dispositivo',
      };
    }
  } catch (err: any) {
    console.error('[PlaylistExportService] Error al exportar archivo nativo:', err);
    return { success: false, error: err.message || 'Error al exportar playlist' };
  }
}

/**
 * Abre el selector de documentos para importar un archivo de lista de reproducción (.m3u, .m3u8, .json)
 * y extrae la colección de pistas normalizadas.
 */
export async function importPlaylistFile(): Promise<ImportResult | null> {
  // Entorno Web: Selector de archivos de HTML5
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.m3u,.m3u8,.json,application/json,audio/x-mpegurl';

      input.onchange = async (event: any) => {
        const file = event.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) {
            resolve(null);
            return;
          }

          const fallbackName = file.name.replace(/\.[a-zA-Z0-9]+$/, '');
          const isJson = file.name.endsWith('.json') || text.trim().startsWith('{');

          const parsed = isJson
            ? parsePlaylistFromJson(text)
            : parsePlaylistFromM3u(text, fallbackName);

          resolve(parsed);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };

      input.click();
    });
  }

  // Entorno Móvil Nativo (Android / iOS)
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        '*/*',
        'application/json',
        'audio/x-mpegurl',
        'audio/mpegurl',
        'application/vnd.apple.mpegurl',
        'text/plain',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }

    const asset = res.assets[0];
    const content = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fallbackName = (asset.name || 'Playlist').replace(/\.[a-zA-Z0-9]+$/, '');
    const isJson = (asset.name || '').toLowerCase().endsWith('.json') || content.trim().startsWith('{');

    if (isJson) {
      const fromJson = parsePlaylistFromJson(content);
      if (fromJson) return fromJson;
    }

    const fromM3u = parsePlaylistFromM3u(content, fallbackName);
    if (fromM3u) return fromM3u;

    // Último intento: parsear como JSON si falló M3U
    return parsePlaylistFromJson(content);
  } catch (err) {
    console.error('[PlaylistExportService] Error al importar playlist nativa:', err);
    return null;
  }
}
