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

- [x] **Fase 8 de Migración a TypeScript — Versión Web Completa y 100% Cobertura del Proyecto (`src/web/`, `index.web.ts`):**
  - [x] Tipado de dominio web en `src/web/types.ts` (`WebTrack`, `WebLrcLine`, `WebLyricsData`, `WebRepeatMode`, `WebPlayerState`, `WebGoogleConfig`, `WebDriveFile`).
  - [x] Migración de estilos web en `src/web/styles/web.styles.ts`.
  - [x] Migración de servicios web: `webCache.ts`, `webLyrics.ts`, `webDrive.ts` y motor de audio HTML5 `webAudioPlayer.ts`.
  - [x] Migración de custom hooks web: `useWebPlayer.ts`, `useWebDrive.ts` y `useWebLyrics.ts`.
  - [x] Migración de componentes web UI: `WebNavbar.tsx`, `WebSidebar.tsx`, `WebTrackList.tsx`, `WebPlayerBottomBar.tsx`, `WebLyricsPanel.tsx`, `WebDriveModal.tsx` y contenedor `App.tsx`.
  - [x] Migración del punto de entrada web `index.web.ts` y ajuste de resolución agnóstica de plataforma en `package.json` (`"main": "index"`).
  - [x] Erradicación del 100% de archivos JavaScript del código fuente (cero archivos `.js`/`.jsx` en `src/`).
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 299 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 826 módulos).
  - [x] Incremento de versión del proyecto a `0.5.23` en `app.config.js`.

- [x] **Ecualizador de Audio (EQ) — Modelo de Dominio e Interfaz Visual (Fase 1):**
  - [x] Modelo de dominio `EqualizerSettings.ts` con 5 bandas estándar (60 Hz, 230 Hz, 910 Hz, 3.6 kHz, 14 kHz), refuerzo de graves (*Bass Boost*) y catálogo de 10 presets acústicos calibrados (Plano, Refuerzo de Graves, Rock, Pop, Jazz, Clásica, Electrónica/Dance, Vocal, Acústica, Personalizado).
  - [x] Módulo de utilidades y persistencia `equalizer.ts` en AsyncStorage (`vulpis_equalizer_settings`) con validación defensiva de rangos (-10 dB a +10 dB) y detección automática de presets.
  - [x] Custom hook reactivo `useEqualizer.ts` con control de ganancia por banda, alternador general, selección de preset y restablecimiento.
  - [x] Interfaz modal interactiva `EqualizerModal.tsx` con sliders táctiles (`@react-native-community/slider`), badges de ganancia con código de color dinámico (boost/cut), selector horizontal de chips de presets y control de refuerzo de graves.
  - [x] Sección modular `EqualizerSection.tsx` en `SettingsModal.tsx` para acceso rápido y conmutador directo.
  - [x] Integración en `PlayerContext`, `useAppController.ts` y montaje en la vista raíz `App.tsx`.
  - [x] Incremento de versión del proyecto a `0.5.24` en `app.config.js`.

- [x] **Ecualizador de Audio (EQ) — Procesamiento Acústico Web Audio API (Fase 2):**
  - [x] Inicialización perezosa y segura del grafo de audio con `AudioContext` y `createMediaElementSource` sobre el elemento HTML5 `<audio>`.
  - [x] Cadena de nodos `BiquadFilterNode` en serie: filtro `lowshelf` para Bass Boost a 80 Hz + 5 filtros (`lowshelf` a 60 Hz, `peaking` a 230 Hz, 910 Hz y 3600 Hz, `highshelf` a 14 kHz) conectados a `audioCtx.destination`.
  - [x] Rampa de volumen y ganancia exponencial sin artefactos acústicos (`setTargetAtTime(target, now, 0.05)`).
  - [x] Integración en `WebAudioPlayer.ts`, reactividad completa en `useWebPlayer.ts`, botón en `WebPlayerBottomBar.tsx`, acceso en `WebSidebar.tsx` y modal `EqualizerModal` en `App.tsx`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 462 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 832 módulos).
  - [x] Incremento de versión del proyecto a `0.5.25` en `app.config.js`.

- [x] **Ecualizador de Audio (EQ) — Puente Nativo para Android con ExoPlayer (Fase 3):**
  - [x] Script de postinstalación `scripts/patch-track-player.js` idempotente en `package.json` que expone `activeAudioSessionId` y `activeInstance` en `TrackPlayerPlaybackService.kt` de `@rntp/player` y emite broadcasts del sistema `ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION`.
  - [x] Módulo nativo Kotlin `VulpisEqualizerModule.kt` que controla `android.media.audiofx.Equalizer` y `android.media.audiofx.BassBoost` con memoria de ajustes previa para acoplamiento automático sobre la sesión activa de ExoPlayer.
  - [x] Apertura del panel de efectos del sistema con `ACTION_DISPLAY_AUDIO_EFFECT_CONTROL_PANEL` (compatible con Wavelet, Dolby Atmos, Samsung SoundAlive).
  - [x] Plugin de configuración Expo `plugins/withVulpisEqualizer.js` para generación prebuild limpia y reproducible.
  - [x] Adaptador TypeScript `src/services/audio/nativeEqualizer.ts` y barrel exports en `src/services/audio/index.ts` y `src/services/index.ts`.
  - [x] Conexión reactiva en `useEqualizer.ts`, `usePlayerStateSync.ts`, `useAppController.ts`, `EqualizerModal.tsx` y `App.tsx`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 450 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 834 módulos).
  - [x] Incremento de versión del proyecto a `0.5.26` en `app.config.js`.

- [x] **Historial de Reproducción (Recently Played):**
  - [x] Modelo de dominio `PlaybackHistoryItem` en `src/models/History.ts` con límite rotativo (`MAX_HISTORY_ITEMS = 100`) y umbral de scrobbling acústico (`MIN_PLAY_TIME_FOR_HISTORY_SEC = 10`).
  - [x] Módulo de persistencia defensiva `src/utils/history.ts` protegido contra desbordes de CursorWindow en SQLite y formateador de tiempo relativo en español.
  - [x] Custom hook reactivo `usePlaybackHistory.ts` con auto-registro libre de condiciones de carrera y operaciones de eliminación/vaciado.
  - [x] Modal interactivo `HistoryModal.tsx` con búsqueda interna, reproducción al toque, agregar a cola, sanitización de portadas y confirmación destructiva.
  - [x] Acceso directo desde el encabezado superior `Header.tsx` y desde el cajón lateral `SidebarDrawer.tsx`.
  - [x] Soporte multiplataforma en la versión web (`src/web/`) con pestaña en `WebSidebar.tsx`, estado vacío en `WebTrackList.tsx` y filtrado reactivo.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 465 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 839 módulos).
  - [x] Incremento de versión del proyecto a `0.5.27` en `app.config.js`.

- [x] **Gestos Táctiles Avanzados en el Reproductor:**
  - [x] Soporte de `PanResponder` nativo con `useNativeDriver: true` en `PlayerArtwork.tsx` para deslizamiento horizontal fluido.
  - [x] Física de arrastre en tiempo real con interpolación de rotación tipo vinilo (-12° a +12°), escala (0.94 a 1.0) y opacidad (0.65 a 1.0).
  - [x] Umbrales de activación configurados (`SWIPE_THRESHOLD = 60px`, `VELOCITY_THRESHOLD = 0.35`) con animación de salida off-screen e ingreso elástico de la siguiente portada.
  - [x] Gesto vertical hacia abajo (Swipe-down) en `PlayerArtwork.tsx` y `PlayerHeader.tsx` para arrastrar y minimizar `PlayerCard` interactivamente.
  - [x] Integración unificada con `useControls.ts` en `PlayerCard.tsx` y paso de `controls` a `Controls.tsx`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 465 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 839 módulos).
  - [x] Incremento de versión del proyecto a `0.5.28` en `app.config.js`.

- [x] **Exportación e Importación de Playlists (.m3u / .json):**
  - [x] Utilidad pura de serialización y parseo `src/utils/playlistIO.ts` para Extended M3U (`#EXTM3U`, `#PLAYLIST:`, `#EXTINF:`) y formato JSON de Vulpis.
  - [x] Servicio multiplataforma `src/services/playlist/playlistExportService.ts` con soporte para hoja de compartir nativa (`expo-sharing`) y descarga/subida de archivos en Web (`Blob` / `<input type="file">`).
  - [x] Acciones asíncronas `handleExportPlaylist` y `handleImportPlaylist` en `usePlaylists.ts` con sanitización de nombres, prevención de duplicados y toasts informativos.
  - [x] Botón "Importar" en el encabezado de `PlaylistsTab.tsx` junto a "Nueva", y botón de exportar en cada fila de lista de reproducción.
  - [x] Botón "Exportar" con selector modal de formato (.m3u / .json) en la tarjeta destacada de `PlaylistDetailView.tsx`.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 465 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 846 módulos).
  - [x] Incremento de versión del proyecto a `0.5.29` en `app.config.js`.

- [x] **Búsqueda Manual Interactiva de Letras en LRCLIB:**
  - [x] Motor de búsqueda de candidatos `searchLrclibManual` en `src/services/lyrics/lyricsService.ts` con clasificación heurística (letras sincronizadas, texto plano e instrumentales).
  - [x] Modal interactivo `LyricsSearchModal.tsx` con input reactivo, contador de resultados, insignias de tipo (.lrc, texto plano, instrumental), comparación de duración y visor de previsualización desplegable.
  - [x] Acceso directo desde la cabecera de `LyricsSheet.tsx` (icono de búsqueda de texto), desde el estado vacío y desde `EditLyricsModal.tsx`.
  - [x] Persistencia instantánea de la letra seleccionada en `vulpis_custom_lyrics` y en la caché de letras `vulpis_online_lyrics_cache`.
  - [x] Soporte de búsqueda manual de candidatos en la versión Web (`searchWebLyricsCandidates`).
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 465 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 849 módulos).
  - [x] Incremento de versión del proyecto a `0.5.30` en `app.config.js`.

- [x] **Editor de Etiquetas ID3 (Tag Editor):**
  - [x] Módulo puro de serialización y utilidades `src/utils/tagEditor.ts` para construcción binaria de bloques estándar ID3v1.1 (128 bytes) y limpieza automática de títulos `cleanTrackTitle`.
  - [x] Mapeo de géneros ID3 canónicos en `src/constants/genres.ts` (148 géneros estándar).
  - [x] Modal interactivo `TagEditorModal.tsx` con campos para Título, Artista, Álbum, Género, chips de géneros frecuentes y atajos de "Limpiar formato" e "Intercambiar Título ⇄ Artista".
  - [x] Opción "Editar información / etiquetas" en el menú contextual de pista `TrackOptionsModal.tsx`.
  - [x] Sincronización atómica reactiva en `useLocalLibrary.ts`, `usePlaylists.ts` y `useAppController.ts` actualizando biblioteca local, listas de reproducción, cola activa, reproductor nativo y archivo físico.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 465 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 853 módulos).
  - [x] Incremento de versión del proyecto a `0.5.31` en `app.config.js`.

---

# Mejoras por hacer

- [x] **Ecualizador de Audio (EQ):** Ecualizador de 5 bandas, Bass Boost, presets calibrados, soporte Web Audio API y puente nativo Android ExoPlayer.
- [x] **Ordenamiento Multicriterio:** Opción para ordenar listas por Nombre, Artista, Duración y Fecha de adición.
- [x] **Exportación e Importación de Playlists:** Respaldar y compartir listas de reproducción en formato `.m3u` o `.json`.
- [x] **Historial de Reproducción:** Sección para consultar las canciones escuchadas recientemente.
- [x] **Búsqueda Manual Interactiva de Letras:** Permitir al usuario buscar y seleccionar manualmente la letra en LRCLIB si la búsqueda automática no coincide.
- [x] **Editor de Etiquetas ID3 (Tag Editor):** Editar título, artista, álbum y género directamente sobre los archivos MP3 locales.
- [x] **Descargador de Carátulas (Album Art Fetcher):** Búsqueda y descarga automática de portadas en alta resolución desde servicios abiertos (Cover Art Archive, MusicBrainz, iTunes Search y Deezer), selector de imágenes locales y guardado optimizado en caché.
- [x] **Preservación y Sincronización de Metadatos en la Nube (Google Drive):**
  - [x] Almacenar metadatos reales (artista, título, álbum) en las propiedades del archivo en Google Drive (`appProperties`) al subir canciones.
  - [x] Deducir y normalizar `Artista - Canción` a partir del nombre del archivo como fallback en lugar de asignar 'Google Drive' como artista.
  - [x] Al descargar o reproducir desde Drive, extraer y persistir los metadatos reales de ID3.
- [x] **Descarga Offline de Playlists Completas:** Permitir descargar de Google Drive todos los archivos de una lista de reproducción con un solo toque.
  - [x] Servicio modular `playlistDownloadService.ts` con cálculo de disponibilidad (`getPlaylistDownloadStats`) y descarga por lotes secuencial con reporte de progreso (`downloadPlaylistOffline`).
  - [x] Interfaz de usuario en `PlaylistDetailView.tsx` con botón heroico "Descargar (N)", distintivo "Disponible Offline" cuando el 100% de pistas están en local, y tarjeta con barra de progreso en tiempo real.
  - [x] Integración reactiva en `useAppController.ts`, `usePlaylists.ts` y `QueueList.tsx`, persistiendo rutas locales en `vulpis_playlists` (AsyncStorage con sanitización preventiva de CursorWindow) y sincronizando la cola activa de `TrackPlayer` en tiempo real.
  - [x] Extracción automática de metadatos ID3 en cada pista descargada para enriquecer carátula, artista y álbum reales sin etiquetas genéricas.
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 472 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 857 módulos).
  - [x] Incremento de versión del proyecto a `0.5.34` en `app.config.js`.
- [x] **Gestor de Almacenamiento y Caché:** Pantalla en Ajustes que muestre el espacio ocupado por la caché de Drive/Letras con opción de limpieza rápida.
  - [x] Servicio modular `storageService.ts` para auditar el uso de disco (`getStorageBreakdown`) y liberar espacio selectiva o globalmente (`clearDriveAudioCache`, `clearArtworkCache`, `clearLyricsStorageCache`, `clearAllStorageCache`).
  - [x] Componente modular `StorageSection.tsx` integrado en `SettingsModal.tsx` con desglose visual por categorías (Música de Drive, Portadas, Letras LRCLIB), distintivo de caché total y botón de actualización en tiempo real.
  - [x] Diálogos interactivos de confirmación (`Alert.alert`) y notificaciones flotantes con el espacio exacto liberado en KB, MB o GB (`formatBytes`).
  - [x] Verificación de compilación estricta con `npx tsc --noEmit` (0 errores), compilación web limpia (`npm run build:web`, 472 módulos) y empaquetado Expo nativo (`npx expo export -p android --no-minify`, 878 módulos).
  - [x] Incremento de versión del proyecto a `0.5.35` en `app.config.js`.
- [ ] **Soporte para Nuevas Fuentes en la Nube:** Opción para conectar servidores WebDAV, Nextcloud o OneDrive.
- [ ] **Selector de Temas Visuales:** Opciones de personalización como Tema AMOLED Black, Cyberpunk, Violeta Vulpis o Tema Dinámico que se adapta al color dominante de la carátula de la canción.
- [x] **Gestos Táctiles Avanzados en el Reproductor:** Deslizar horizontalmente la carátula para cambiar de pista (anterior/siguiente) y deslizar hacia abajo para minimizar `PlayerCard`.
- [ ] **Soporte de Widget para Android:** Widget de pantalla de inicio con controles de reproducción y carátula.
- [ ] **Atajos y Controles Multimedia Avanzados:** Soporte extendido para eventos de auriculares Bluetooth (doble toque, triple toque).
- [ ] **Migración a `@shopify/flash-list`:** Reemplazar `FlatList` tradicional por `FlashList` para optimizar el rendimiento y la fluidez del scroll con miles de canciones.
- [x] **Migración Completa a TypeScript:** Tipado estricto culminado en toda la aplicación (Modelos, Servicios, Utilidades, Hooks, Contexto, Componentes y App).
- [ ] **Suite de Pruebas Unitarias (Jest):** Implementar tests para lógica crítica como `drive.js`, `metadata.js` y `onlineLyrics.js`.