# Vulpis Player 🦊 - Listado de Tareas (TODO)

Este documento detalla el estado actual del desarrollo de Vulpis Player, registrando las características implementadas y las tareas pendientes en el roadmap de desarrollo.

---

## 🟢 Tareas Completadas

### 1. Sincronización con Google Drive (Nube Privada)
- [x] **Autenticación OAuth 2.0 con PKCE:** Flujo seguro de autorización integrado para aplicaciones nativas sin necesidad de servidores intermedios.
- [x] **Configuración Segura y Dinámica:** Integración con variables de entorno (`.env`) y regeneración de esquemas de callback dinámicos en `app.config.js` para mantener repositorios públicos limpios.
- [x] **Bypass de Restricciones ExoPlayer (Caché local en demanda):** Intercepción de urls de Drive para descarga local usando `expo-file-system/legacy`, evitando el fallo de descarte de cabeceras de autorización en redireccionamientos entre dominios.
- [x] **Persistencia de Caché:** Detección de canciones ya descargadas en el directorio de almacenamiento temporal (`FileSystem.cacheDirectory`) para reproducción inmediata sin consumo de datos redundantes.
- [x] **UI de Conexión:** Pantalla/Tarjeta interactiva con botones para conectar, desconectar y actualizar canciones de la nube de Google Drive.

### 2. Biblioteca Local Dinámica e Importación
- [x] **Escaneo de Almacenamiento:** Integración con `expo-media-library` para buscar archivos `.mp3` automáticamente en el dispositivo.
- [x] **Selector de Archivos:** Integración con `expo-document-picker` para importar canciones seleccionadas puntualmente por el usuario.
- [x] **Persistencia de Biblioteca:** Almacenamiento local mediante `AsyncStorage` para preservar pistas importadas y escaneadas al reiniciar la aplicación.

### 3. Motor de Audio Avanzado y Controles
- [x] **Controles Premium:** Modos **Aleatorio (Shuffle)** y **Repetición (Repeat)** configurados nativamente en el reproductor.
- [x] **Sincronización JSI de Latencia Cero:** Sistema de polling de 250ms a llamadas nativas en C++ para refrescar el estado del reproductor y sincronizar de forma reactiva la UI (carátula, controles, progreso).
- [x] **Evitación de Concurrencia (Debouncing):** Control global de bloqueo (`isProcessing`) para deshabilitar clicks accidentales durante la carga de comandos nativos en el reproductor.

### 4. Barra de Progreso Interactiva (Slider)
- [x] **Deslizador de Tiempo:** Reemplazar la barra de progreso estática actual en `ProgressBar.js` por un slider táctil interactivo (ej. `@react-native-community/slider`).
- [x] **Búsqueda Manual (Seeking):** Conectar la acción de arrastrar el slider a `TrackPlayer.seekTo()` para adelantar o retroceder la canción manualmente.

### 5. Persistencia del Estado del Reproductor
- [x] **Guardar Sesión Activa:** Almacenar la última canción en reproducción, la posición del progreso en segundos y la cola actual en `AsyncStorage`.
- [x] **Restaurar al Iniciar:** Configurar el reproductor al abrir la app para que cargue la última pista y se desplace al timestamp guardado para continuar la escucha con un toque.

### 6. Pre-descarga de Cola para Google Drive (Background Buffering)
- [x] **Buffering Anticipado de Cola:** Implementar un servicio de pre-descarga para el archivo `.mp3` de la *siguiente* canción de la cola en segundo plano.
- [x] **Control de Flujo de Fondo:** Asegurar que los botones de salto (Siguiente/Anterior) de la barra de notificaciones del sistema funcionen sin retrasos de red cuando la pantalla del teléfono está bloqueada.

### 7. Personalización Estética Dinámica (Diseño Premium)
- [x] **Extracción de Color Dominante:** Integrar `react-native-image-colors` (o similar) para analizar los metadatos de la carátula de la canción en reproducción.
- [x] **Fondo Reactivo:** Animar el degradado de fondo en `PlayerCard.js` para que se adapte y reaccione suavemente al color dominante del disco actual.

### 8. Gestión de Playlists Personalizadas
- [x] **Creación de Listas:** Permitir al usuario crear, renombrar y eliminar listas de reproducción.
- [x] **Mezcla Híbrida:** Posibilitar la mezcla de archivos locales (importados) y archivos en la nube (Drive) dentro de una misma playlist personalizada con guardado persistente.

---

## 🟡 Tareas Pendientes (Roadmap)

*¡Todas las características planeadas en el roadmap inicial de Vulpis Player han sido completamente implementadas!* 🦊🚀