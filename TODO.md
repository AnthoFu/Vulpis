# Plan de Trabajo y Mejoras - VULPIS 🦊

## ✅ Tareas Completadas
- [x] Refactorizar logs -> Traducción al español.
- [x] Refactorización de comentarios -> Traducción al español.
- [x] Mejora del icono -> Visualización correcta en pantallas principales de los teléfonos.
- [x] Capacidad de descarga de canciones desde Google Drive a almacenamiento local.
- [x] Capacidad de eliminar canciones del almacenamiento local.
- [x] Mejora visual en la lista de reproducción y en la cola de reproducción.
- [x] Refactorización de componentes largos.
- [x] Refactorización de estilos.
- [x] Refactorización de vistas y lógica (Separación limpia de lógica y componentes mediante Custom Hooks).
- [x] Mejora estética y cambio de títulos.
- [x] Vista de Letras: Sistema de lectura de letras de canciones estilo Spotify (metadatos ID3).
- [x] Eliminación de canciones por defecto y escaneo automático de música al iniciar.
- [x] Modularización de animaciones escalables y homogéneas.
- [x] Mejora en el sistema de letras: Búsqueda automática en API pública.
  - [x] Añadir opción en Ajustes/Configuración: "Buscar letras en línea" (Desactivado por defecto).
  - [x] Integración con API pública de letras (LRCLIB API - soporte para letras sincrónicas .lrc y normales).
  - [x] Algoritmo de coincidencia aproximada (Fuzzy Matching por Coeficiente Sørensen-Dice).
  - [x] Caché local persistente para letras descargadas.
  - [x] Cascada de prioridad en [`usePlayerCard`] ID3 locales -> Caché local -> API pública en línea -> "Letra no encontrada".
- [x] **Temporizador de Apagado (Sleep Timer):** Opción para detener la reproducción automáticamente después de X minutos (15m, 30m, 60m o al finalizar la pista actual).
- [x] **Fundido Cruzado (Crossfade):** Transición suave entre canciones para evitar pausas o cortes bruscos al cambiar de pista.
- [x] **Normalización de Volumen (ReplayGain):** Mantener un nivel de volumen uniforme entre pistas de distintos álbumes o fuentes.
  - [x] Soporte para extracción de etiquetas ID3v2 (`TXXX`, `COMM`, `RVA2`), FLAC/Vorbis comments y Apple Sound Check (`iTunNORM`).
  - [x] Modos de normalización: Por Pista (Track Gain) y Por Álbum (Album Gain).
  - [x] Pre-amplificación acústica configurable (-6 dB a +6 dB) para pistas con y sin ReplayGain.
  - [x] Sistema de protección contra distorsión y saturación digital (Anti-Clipping Limiter).
  - [x] Integración bidireccional suave con el motor de Fundido Cruzado (Crossfade).
  - [x] Panel de configuración interactivo en Ajustes y visualización en el modal de opciones de pista.

- [x] **Búsqueda Instantánea y Filtrado:** Barra de búsqueda en la biblioteca para filtrar rápidamente por Título, Artista, Álbum o Género.
  - [x] Extracción nativa de etiquetas ID3v2 para Álbum (`TALB`/`TAL`) y Género (`TCON`/`TCO`) con decodificación de géneros estándar ID3v1.
  - [x] Selector interactivo con chips/pestañas de filtro ("Todos", "Título", "Artista", "Álbum", "Género").
  - [x] Búsqueda normalizada sin distinción de mayúsculas/minúsculas ni acentos diacríticos.
  - [x] Visualización de Álbum y etiquetas de Género en las filas de canciones y en el modal de detalles.
  - [x] Soporte completo en la Biblioteca Local, Google Drive y dentro de Playlists individuales.
- [x] **Refactorización Integral de la Cola de Reproducción y Drag & Move:**
  - [x] Sincronización nativa fluida con `TrackPlayer.moveMediaItem(fromIndex, toIndex)` sin cortes de audio ni reinicios de canción.
  - [x] Modularización de la hoja de la cola en [`QueueSheet.js`]
  - [x] Estructura visual estilo Spotify: sección fija "Reproduciendo ahora" + sección reordenable "A continuación" + historial desplegable "Anteriores".
  - [x] Drag & Move táctil con PanResponder independiente, elevación visual, seguimiento en tiempo real y apertura de hueco en slots adyacentes.
  - [x] Controles rápidos de accesibilidad: botones para subir (🔼) y bajar (🔽) por pista, y botón para "Vaciar cola" con confirmación.
  - [x] Claves únicas estables (`queueId`) para evitar desmontaje de componentes en React durante el arrastre.
  - [x] Protección del bucle de polling en `useAppController` mediante bandera de reordenamiento atómico (`isReorderingRef`).
- [x] Resolver error: `ERROR  [useAppController] Error al leer el estado guardado del reproductor: [Error: Row too big to fit into CursorWindow requiredPos=0, totalRows=1]` (Sanitización de carátulas base64 y exclusión de listas redundantes en `vulpis_player_state`).

---

- [x] **Sistema de Favoritos ("Me Gusta"):**
  - [x] Botón de acceso rápido con icono de corazón animado (efecto pop/spring) en PlayerCard.js para alternar favoritos en la pista activa.
  - [x] Lista automática y persistente de "Favoritos" en usePlaylists.js guardada en AsyncStorage con sanitización preventiva de carátulas para evitar desbordes en SQLite (`CursorWindow`).
  - [x] Tarjeta destacada con degradado rojo/rosa e insignia "AUTOMÁTICA" en la vista de Mis Playlists.
  - [x] Protección de la lista de Favoritos contra eliminación accidental.
  - [x] Opción de "Añadir/Quitar de Favoritos" en el modal de opciones de pista [`TrackOptionsModal.js`].
  - [x] Indicador y selector especial de Favoritos en el selector de listas [`PlaylistPickerModal.js`].
  - [x] Eliminación directa desde la vista detallada de la lista de Favoritos con icono de corazón activo.

- [x] **Filtro Inteligente de Audio Local (Exclusión de WhatsApp y Grabadoras):**
  - [x] Creación de utilidad centralizada audioFilter.js para detectar y excluir audios no musicales.
  - [x] Exclusión de notas de voz y audios de WhatsApp (`AUD-*`, `PTT-*`, rutas `com.whatsapp`, `WhatsApp/Media`, etc.).
  - [x] Exclusión de audios de Telegram, Messenger, Signal, Discord, Instagram y otras apps de mensajería.
  - [x] Exclusión de notas de voz y grabaciones de llamadas telefónicas (`sound_recorder`, `voicenote`, `Call_*`, `REC_*`).
  - [x] Filtrado de sonidos del sistema, tonos de notificación/alarma (< 15s) y cachés privadas de aplicaciones.
  - [x] Depuración y saneamiento automático de pistas ya almacenadas en caché (`vulpis_local_tracks`).

- [x] **Organización por Pestañas:** Vistas divididas por Canciones, Árbol de Artistas, Álbumes y Listas de Reproducción.
  - [x] Selector interactivo de 4 pestañas superiores con iconos y diseño responsivo (`LIBRARY_TABS`).
  - [x] Módulo modular de organización de biblioteca libraryOrganizer.js.
  - [x] Vista de Árbol de Artistas con agrupación jerárquica (Artista -> Álbumes -> Canciones), avatares circulares y botón para reproducir la discografía completa del artista.
  - [x] Vista de Álbumes con carátulas cuadradas grandes, información del artista, pistas ordenadas y botón para reproducir el álbum completo.
  - [x] Integración transparente de Mis Playlists (con lista de reproducción activa, favoritos automáticos y creación).
  - [x] Buscador adaptativo con filtrado en tiempo real según la pestaña activa (Canciones, Artistas, Álbumes o Playlists).

- [x] **Auto-scroll y Resaltado en Letras Sincronizadas (.lrc):**
  - [x] Parser mejorado de archivos y cadenas `.lrc` con soporte para marcas de tiempo flexibles, exclusión de etiquetas de metadatos (`[ar:]`, `[ti:]`, etc.), compensación por `[offset:]` y detección de silencios/pausas instrumentales (`♪ ♪ ♪`).
  - [x] Resaltado dinámico con contraste mejorado: estrofas ya reproducidas atenuadas, línea activa vibrante con sombra de texto y barra lateral violeta, y líneas por cantar en tono suave.
  - [x] Desplazamiento automático interactivo y centrado suave en la línea activa conforme avanza la reproducción de la canción.
  - [x] Interactividad táctil (Tap-to-Seek): toque sobre cualquier línea con marca de tiempo para saltar la reproducción (`TrackPlayer.seekTo`) a ese segundo exacto.
  - [x] Detección inteligente de scroll manual: pausa temporal del auto-scroll al deslizar manualmente y botón flotante "Sincronizar" para regresar al compás actual o reanudación automática tras inactividad.
  - [x] Insignia visual "Sincronizadas" en el encabezado de la hoja de letras.

- [x] **Modularización y Estandarización del Núcleo de Reproducción:**
  - [x] Refactorización y desacoplamiento de responsabilidades en `useAppController.js` y `usePlayerStateSync.js`.
  - [x] Documentación exhaustiva con JSDoc y tipado descriptivo en español para el orquestador principal y sincronizador JSI.
  - [x] Creación del barrel export centralizado `src/hooks/index.js` para estandarizar el consumo de la capa de hooks.
  - [x] Optimización de renderizado mediante `useCallback` en `handleSourceChange` y `handleSelectTrack`.
  - [x] Incremento de versión del proyecto a `0.5.11` en `app.config.js`.

- [x] **Desacoplamiento de Capa de Servicios e Infraestructura (`src/services/`):**
  - [x] Creación de `src/services/drive/` para aislar API REST, autenticación OAuth PKCE y descargas con FileSystem.
  - [x] Creación de `src/services/lyrics/lyricsService.js` para clientes de letras en línea (LRCLIB, Lyrist) y caché de AsyncStorage.
  - [x] Creación de `src/services/scanner/mediaScanner.js` para el escaneo nativo del sistema de archivos con MediaLibrary.
  - [x] Creación de `src/services/index.js` como barrel export unificado de infraestructura.
  - [x] Preservación de adaptadores retrocompatibles en `src/utils/` y migración de hooks y componentes a la nueva capa de servicios.

- [x] **Arquitectura de Contexto Global y Erradicación de Prop Drilling (`src/context/`):**
  - [x] Creación de `PlayerContext` y `PlayerProvider` en `src/context/PlayerContext.js`.
  - [x] Hook de consumo `usePlayer()` con validación estricta de alcance (Provider boundary check).
  - [x] Barrel export `src/context/index.js` para simplificar la integración de contextos.
  - [x] Adaptación híbrida de componentes (`Header`, `SidebarDrawer`, `SettingsModal`, `MiniPlayer`, `PlayerCard`, `QueueList`) para consumir directamente del contexto o aceptar props opcionales.
  - [x] Limpieza radical de `App.js`: reducción de ~244 líneas con más de 70 props manuales a ~80 líneas declarativas y desacopladas.

- [x] **Fase 1 de Migración Progresiva a TypeScript y Modelos de Dominio (`src/models/`):**
  - [x] Configuración del compilador TypeScript (`tsconfig.json`) extendiendo `expo/tsconfig.base` con verificación estricta.
  - [x] Creación de `src/models/Track.ts`: interfaz `Track`, `ReplayGainData`, fábrica `createTrack` y sanitización contra `CursorWindow`.
  - [x] Creación de `src/models/Playlist.ts`: interfaz `Playlist`, constantes de Favoritos, fábrica `createPlaylist` y utilidades de ordenamiento.
  - [x] Creación de `src/models/AudioSettings.ts`: interfaces y valores predeterminados para `ReplayGainSettings`, `CrossfadeSettings` y `LyricsSettings`.
  - [x] Barrel export `src/models/index.ts` para tipado y acceso unificado.
  - [x] Verificación estricta de tipos con `tsc --noEmit` y validación de bundling híbrido sin minificar en Expo.

- [x] **Modularización Integral de PlayerCard (`src/components/player/`):**
  - [x] Desacoplamiento del componente monolítico `PlayerCard.js` en subcomponentes atómicos de presentación.
  - [x] Creación de `PlayerHeader.js`: botón de minimizar/cerrar y título de sección.
  - [x] Creación de `PlayerArtwork.js`: contenedor de portada con sombra dinámica y elevación visual.
  - [x] Creación de `PlayerTrackDetails.js`: título, artista y animación spring encapsulada para el botón de Favoritos.
  - [x] Creación de `PlayerLiveLyric.js`: banner interactivo con animación independiente de entrada y opacidad para la línea activa.
  - [x] Creación de `PlayerFooterActions.js`: barra inferior de accesos directos a Letras, Cola y Temporizador de apagado.
  - [x] Barrel export actualizado en `src/components/index.js` y verificación de tipos/bundling sin errores.

- [x] **Fase 2 de Migración a TypeScript — Capa de Servicios (`src/services/`):**
  - [x] Migración de `driveAuth.ts`, `driveApi.ts` y `driveDownload.ts` a TypeScript estricto con interfaces de credenciales (`GoogleOAuthConfig`), archivos (`DriveFile`) y contratos de subida/descarga.
  - [x] Integración de `Track` y `createTrack` en el mapeador de archivos de Drive y exportador al dispositivo.
  - [x] Migración de `mediaScanner.ts` tipando `ScanResult`, `ScanDeviceAudioOptions` y retornos inmutables de `Track[]`.
  - [x] Migración de `lyricsService.ts` tipando `LyricCandidate`, `getSettings`, `saveSettings` y respuestas de APIs públicas (LRCLIB, Lyrist, Lyrics.ovh).
  - [x] Barrel exports actualizados en `src/services/drive/index.ts` y `src/services/index.ts`.
  - [x] Verificación de tipos estricta con `tsc --noEmit` y empaquetado Expo sin errores.

- [x] **Fase 3 de Migración a TypeScript — Capa de Utilidades Puras y Dominio (`src/utils/`):**
  - [x] Migración de utilidades matemáticas y de texto: `fuzzyMatch.ts`, `trackFilter.ts`, `audioFilter.ts`.
  - [x] Migración de motores acústicos y transiciones: `crossfade.ts` y `replayGain.ts` fuertemente tipados con `AudioSettings` y `Track`.
  - [x] Migración de organización de datos y caché: `artwork.ts`, `lyrics.ts` (con interfaz `LrcLine`) y `libraryOrganizer.ts` (árboles `ArtistNode` y `AlbumNode`).
  - [x] Migración del parser nativo ID3 y metadatos: `id3Parser.ts` y `metadata.ts` tipando `ID3ParsedMetadata`.
  - [x] Migración de adaptadores retrocompatibles (`drive.ts`, `driveAuth.ts`, `driveDownload.ts`, `localScanner.ts`, `onlineLyrics.ts`).
  - [x] Creación de `src/types/modules.d.ts` y barrel export centralizado `src/utils/index.ts`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores) y bundle exitoso con `npx expo export`.

- [x] **Fase 4 de Migración a TypeScript — Capa de Custom Hooks (`src/hooks/`):**
  - [x] Migración de hooks centrales de reproducción: `usePlayerInitializer.ts`, `usePlayerStateSync.ts`, `usePlayerPersistence.ts`, `useQueueController.ts`, `useAudioSettings.ts`, `useSleepTimer.ts`.
  - [x] Migración de fuentes y bibliotecas: `useLocalLibrary.ts`, `useGoogleDrive.ts`, `useDrivePrefetch.ts`, `usePlaylists.ts`.
  - [x] Migración de controladores visuales: `useControls.ts`, `useMiniPlayer.ts`, `useProgressBar.ts`, `usePlayerCard.ts`, `useQueueList.ts`, `useSyncedLyrics.ts`, `useSheetAnimation.ts`, `useSidebarDrawer.ts`, `useToast.ts`.
  - [x] Migración del orquestador maestro `useAppController.ts` y barrel export `src/hooks/index.ts`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores) y empaquetado Expo sin errores.

- [x] **Fase 5 de Migración a TypeScript — Componentes de UI, Modales, Contexto y App (`src/components/`, `src/context/`, `App.tsx`):**
  - [x] Migración de Contexto: `PlayerContext.tsx` y barrel export `src/context/index.ts`.
  - [x] Migración de Layout: `Header.tsx` y `SidebarDrawer.tsx`.
  - [x] Migración de Modales: `SettingsModal.tsx`, `SleepTimerModal.tsx`, `TrackOptionsModal.tsx`, `PlaylistPickerModal.tsx`, `EditLyricsModal.tsx` y secciones de configuración (`CrossfadeSection.tsx`, `OnlineLyricsSection.tsx`, `ReplayGainSection.tsx`).
  - [x] Migración de Componentes de Reproductor: `PlayerCard.tsx`, `MiniPlayer.tsx`, `Controls.tsx`, `ProgressBar.tsx`, `QueueSheet.tsx`, `QueueItemRow.tsx`, `LyricsSheet.tsx` y subcomponentes atómicos (`PlayerHeader.tsx`, `PlayerArtwork.tsx`, `PlayerTrackDetails.tsx`, `PlayerLiveLyric.tsx`, `PlayerFooterActions.tsx`).
  - [x] Migración de Biblioteca Musical: `QueueList.tsx`, `TrackItem.tsx`, `LibraryTabs.tsx`, `LibrarySearchBar.tsx`, `GoogleDrivePanel.tsx`, `SongsTab.tsx`, `AlbumsTab.tsx`, `ArtistsTab.tsx`, `PlaylistsTab.tsx`, `PlaylistDetailView.tsx`, `PlaylistArtwork.tsx`.
  - [x] Barrel export unificado con interfaces públicas en `src/components/index.ts`.
  - [x] Migración del contenedor raíz de aplicación `App.tsx`.
  - [x] Eliminación completa de archivos `.js` de componentes y vistas.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores) y empaquetado Expo (`npx expo export -p android --no-minify`, 823 módulos).

- [x] **Ordenamiento Multicriterio en la Biblioteca:**
  - [x] Modelo de dominio `SortOptions.ts` con tipos (`SortField`, `SortOrder`, `SortConfig`) y configuración por defecto.
  - [x] Extensión de `Track` con `addedAt` y captura de marcas de tiempo en el escáner de medios (`mediaScanner.ts`).
  - [x] Utilidad pura `trackSort.ts` para ordenamiento insensible a acentos/mayúsculas (A-Z / Z-A por Título, Artista, Álbum; más corta/larga por Duración; más reciente/antigua por Fecha de adición) y persistencia en AsyncStorage (`vulpis_library_sort_config`).
  - [x] Modal interactivo `SortModal.tsx` con cambio de dirección interactivo (ascendente/descendente) e indicadores visuales activos.
  - [x] Integración de botón de ordenamiento en `LibrarySearchBar.tsx`, conexión reactiva en `useQueueList.ts` y propagación a `QueueList.tsx`, `PlaylistsTab.tsx` y `PlaylistDetailView.tsx`.
  - [x] Incremento de versión del proyecto a `0.5.20` en `app.config.js`.

- [x] **Fase 6 de Migración a TypeScript — Constantes, Barrel Export y Entrypoints Nativos (`src/constants/`, `index.ts`, `service.ts`):**
  - [x] Migración de `animations.ts`, `colors.ts`, `config.ts` y `tracks.ts` con tipado estricto de tokens de animación, paleta de colores, credenciales OAuth y pistas de fallback.
  - [x] Creación de `src/constants/index.ts` como barrel export centralizado.
  - [x] Migración de `service.ts` implementando `playbackService` con la firma nativa `BackgroundEventHandler` y tipado de `BackgroundEvent` de `@rntp/player`.
  - [x] Migración del punto de entrada principal `index.ts` con registro síncrono de eventos remotos para iOS/primer plano y enlace de `package.json` a `index.ts`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores) y empaquetado Expo (`npx expo export -p android --no-minify`, 826 módulos).
  - [x] Incremento de versión del proyecto a `0.5.21` en `app.config.js`.

- [x] **Fase 7 de Migración a TypeScript — Hojas de Estilo (`src/styles/`):**
  - [x] Migración de los 8 módulos de estilo de biblioteca en `src/styles/library/` (`Tabs`, `SearchBar`, `TrackItem`, `DrivePanel`, `PlaylistsTab`, `LibraryModals`, `ArtistsTab`, `AlbumsTab`).
  - [x] Migración del compositor de biblioteca `QueueList.styles.ts`.
  - [x] Migración de estilos de componentes y modales principales: `App.styles.ts`, `Header.styles.ts`, `MiniPlayer.styles.ts`, `Controls.styles.ts`, `ProgressBar.styles.ts`, `SidebarDrawer.styles.ts`, `PlayerCard.styles.ts`, `QueueSheet.styles.ts`, `SettingsModal.styles.ts`, `EditLyricsModal.styles.ts`, `SleepTimerModal.styles.ts`.
  - [x] Corrección de tipado estricto para `StyleSheet.absoluteFill` en `QueueSheet.styles.ts`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores) y empaquetado Expo (`npx expo export -p android --no-minify`, 826 módulos).
  - [x] Incremento de versión del proyecto a `0.5.22` en `app.config.js`.

---

# Mejoras por hacer

- [ ] **Ecualizador de Audio (EQ):** Ecualizador con presets integrados (Rock, Pop, Jazz, Bass Boost, etc.).
- [x] **Ordenamiento Multicriterio:** Opción para ordenar listas por Nombre, Artista, Duración y Fecha de adición.
- [ ] **Exportación e Importación de Playlists:** Respaldar y compartir listas de reproducción en formato `.m3u` o `.json`.
- [ ] **Historial de Reproducción:** Sección para consultar las canciones escuchadas recientemente.
- [ ] **Búsqueda Manual Interactiva de Letras:** Permitir al usuario buscar y seleccionar manualmente la letra en LRCLIB si la búsqueda automática no coincide.
- [ ] **Editor de Etiquetas ID3 (Tag Editor):** Editar título, artista, álbum y género directamente sobre los archivos MP3 locales.
- [ ] **Descargador de Carátulas (Album Art Fetcher):** Búsqueda y descarga automática de portadas en alta resolución desde servicios abiertos (Cover Art Archive / MusicBrainz).
- [ ] **Descarga Offline de Playlists Completas:** Permitir descargar de Google Drive todos los archivos de una lista de reproducción con un solo toque.
- [ ] **Gestor de Almacenamiento y Caché:** Pantalla en Ajustes que muestre el espacio ocupado por la caché de Drive/Letras con opción de limpieza rápida.
- [ ] **Soporte para Nuevas Fuentes en la Nube:** Opción para conectar servidores WebDAV, Nextcloud o OneDrive.
- [ ] **Selector de Temas Visuales:** Opciones de personalización como Tema AMOLED Black, Cyberpunk, Violeta Vulpis o Tema Dinámico que se adapta al color dominante de la carátula de la canción.
- [ ] **Gestos Táctiles Avanzados en el Reproductor:** Deslizar horizontalmente la carátula para cambiar de pista (anterior/siguiente) y deslizar hacia abajo para minimizar `PlayerCard`.
- [ ] **Soporte de Widget para Android:** Widget de pantalla de inicio con controles de reproducción y carátula.
- [ ] **Atajos y Controles Multimedia Avanzados:** Soporte extendido para eventos de auriculares Bluetooth (doble toque, triple toque).
- [ ] **Migración a `@shopify/flash-list`:** Reemplazar `FlatList` tradicional por `FlashList` para optimizar el rendimiento y la fluidez del scroll con miles de canciones.
- [x] **Migración Completa a TypeScript:** Tipado estricto culminado en toda la aplicación (Modelos, Servicios, Utilidades, Hooks, Contexto, Componentes y App).
- [ ] **Suite de Pruebas Unitarias (Jest):** Implementar tests para lógica crítica como `drive.js`, `metadata.js` y `onlineLyrics.js`.