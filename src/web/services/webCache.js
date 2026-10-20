/**
 * Servicio de caché local para la versión Web de Vulpis.
 * Utiliza la Cache Storage API del navegador (o IndexedDB como fallback)
 * para almacenar los blobs de audio descargados de Google Drive.
 */

const CACHE_NAME = 'vulpis-web-audio-v1';

export const isCacheAvailable = () => {
  return typeof window !== 'undefined' && 'caches' in window;
};

/**
 * Obtiene un Blob de audio previamente guardado en la caché del navegador.
 */
export const getCachedAudioBlob = async (fileId) => {
  if (!isCacheAvailable()) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const requestUrl = `https://vulpis.local/drive-audio/${fileId}`;
    const response = await cache.match(requestUrl);
    if (response) {
      console.log(`[WebCache] Pista ${fileId} cargada directamente desde la caché local del navegador`);
      return await response.blob();
    }
  } catch (err) {
    console.warn('[WebCache] Error al consultar la caché:', err);
  }
  return null;
};

/**
 * Almacena un Blob de audio en la caché del navegador.
 */
export const saveAudioBlob = async (fileId, blob) => {
  if (!isCacheAvailable() || !blob) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const requestUrl = `https://vulpis.local/drive-audio/${fileId}`;
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'audio/mpeg',
        'Content-Length': blob.size.toString(),
      },
    });
    await cache.put(requestUrl, response);
    console.log(`[WebCache] Pista ${fileId} guardada en caché local del navegador`);
  } catch (err) {
    console.warn('[WebCache] Error al guardar en caché:', err);
  }
};

/**
 * Limpia todas las pistas de audio almacenadas en la caché web.
 */
export const clearWebAudioCache = async () => {
  if (!isCacheAvailable()) return;
  try {
    await caches.delete(CACHE_NAME);
    console.log('[WebCache] Caché de audio eliminada con éxito');
  } catch (err) {
    console.error('[WebCache] Error al limpiar la caché:', err);
  }
};
