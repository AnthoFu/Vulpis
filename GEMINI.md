# Guía del Proyecto Vulpis 🦊 para Gemini / Asistentes AI (`GEMINI.md`)

Este documento sirve como la fuente primaria de verdad y contexto técnico para interactuar, depurar, refactorizar y extender el código del proyecto **Vulpis**.

---

## 📖 1. Visión General del Proyecto

**Vulpis** es un reproductor de audio móvil premium de código abierto diseñado para Android (con soporte base para iOS), desarrollado sobre **React Native** y el ecosistema **Expo** (SDK 56).

### Objetivos y Filosofía
- **Rendimiento Nativo Sin Concesiones:** Cero latencia en respuestas de UI y operaciones de audio, apoyándose en la API JSI de `@rntp/player` y llamadas síncronas en C++.
- **Reproducción Híbrida y en la Nube:** Capacidad para reproducir música del almacenamiento local o de una cuenta privada de **Google Drive** con un sistema inteligente de caché bajo demanda.
- **Experiencia de Usuario Premium:** Interfaz inspirada en reproductores modernos (Spotify, Apple Music) con soporte para letras sincronizadas (.lrc), ReplayGain, Crossfade, temporizador de apagado, gestión avanzada de colas y drag-and-drop.
- **Resiliencia de Datos:** Arquitectura a prueba de condiciones de carrera y salvaguardas explícitas contra desbordamientos de memoria en SQLite (`CursorWindow`).

---

## 🛠️ 2. Stack Tecnológico

| Capa / Módulo | Tecnología / Dependencia | Versión / Detalle |
| :--- | :--- | :--- |
| **Framework Base** | React Native + Expo | RN 0.85.3 / Expo SDK ~56.0.12 |
| **Arquitectura Nativa** | Nueva Arquitectura (JSI / Fabric / TurboModules) | `newArchEnabled: false` en app.config.js para compatibilidad |
| **Motor de Audio** | `@rntp/player` | `^5.6.0` (Servicio nativo en segundo plano) |
| **Almacenamiento Local** | `@react-native-async-storage/async-storage` | `2.2.0` |
| **Sistema de Archivos** | `expo-file-system/legacy` | `~56.0.8` (Descargas nativas con seguimiento de redirecciones) |
| **Metadatos de Audio** | `jsmediatags` + parsers ID3 internos | `^3.9.7` (Lectura de ID3v2, TALB, TCON, USLT, SYLT, ReplayGain) |
| **Selección y Escaneo** | `expo-media-library` + `expo-document-picker` | Escaneo granular de audio local e importación de archivos |
| **Autenticación en la Nube** | `expo-web-browser` + `expo-linking` | OAuth 2.0 con PKCE contra Google Cloud APIs |
| **Letras en Línea** | LRCLIB Public API (`lrclib.net`) | Sincronización `.lrc` con auto-scroll y coincidencia difusa |
| **Controles de UI** | `@expo/vector-icons`, `@react-native-community/slider`, `expo-linear-gradient` | Iconografía Feather / Ionicons / MaterialCommunityIcons |

---

## 📂 3. Estructura de Directorios

```plaintext
Vulpis/
├── android/                   # Código nativo generado de Android (Gradle, Manifest, etc.)
├── ios/                       # Código nativo generado de iOS
├── assets/                    # Iconos, imágenes por defecto y capturas de pantalla
├── src/
│   ├── components/            # Componentes modulares de UI (desacoplados de lógica pura)
│   │   ├── layout/            # Cabecera, Sidebar Drawer, contenedores principales
│   │   ├── player/            # PlayerCard, MiniPlayer, Controls, ProgressBar, LyricsSheet, QueueSheet
│   │   ├── library/           # QueueList, TrackItem, LibraryTabs, LibrarySearchBar, GoogleDrivePanel, Tabs
│   │   ├── modals/            # Modales (Ajustes, Letras, SleepTimer, Opciones de Pista, Selector de Listas)
│   │   └── index.js           # Barrel export de componentes
│   ├── hooks/                 # Custom Hooks de React (Lógica de estado y controladores)
│   │   ├── useAppController.js        # Orquestador maestro que conecta los hooks modulares
│   │   ├── usePlayerInitializer.js   # Inicialización de TrackPlayer y capacidades
│   │   ├── usePlayerStateSync.js      # Polling activo JSI (250ms) y sincronización nativa
│   │   ├── usePlayerPersistence.js    # Guardado y recuperación segura en AsyncStorage
│   │   ├── useQueueController.js      # Manejo de cola, adición, eliminación y reordenamiento nativo
│   │   ├── useLocalLibrary.js         # Escaneo con expo-media-library, importación y filtrado
│   │   ├── useGoogleDrive.js          # Sincronización, subida, descarga y autenticación con Drive
│   │   ├── useAudioSettings.js        # Gestión de ReplayGain y Crossfade
│   │   ├── usePlaylists.js            # Playlists personalizadas y Favoritos automáticos
│   │   ├── useSyncedLyrics.js         # Resaltado en tiempo real, auto-scroll y Tap-to-Seek
│   │   ├── useSleepTimer.js           # Temporizador de apagado progresivo o por fin de pista
│   │   ├── useDrivePrefetch.js        # Precarga y descarga transparente de canciones de la nube
│   │   └── ...                        # Hooks específicos de componentes (MiniPlayer, Controls, etc.)
│   ├── utils/                 # Funciones puras y utilidades desacopladas
│   │   ├── drive.js           # API client de Google Drive (listado, metadatos, borrado)
│   │   ├── driveAuth.js       # Flujo OAuth 2.0 PKCE para Google Cloud
│   │   ├── driveDownload.js   # Descarga con reanudación y gestión de archivos en caché
│   │   ├── onlineLyrics.js    # Cliente LRCLIB y caché persistente de letras
│   │   ├── lyrics.js          # Parser de marcas de tiempo LRC `[mm:ss.xx]` y normalizador
│   │   ├── crossfade.js       # Rampa matemática de volumen y transiciones suaves
│   │   ├── replayGain.js      # Decodificación de Track/Album Gain, Sound Check y Anti-Clipping
│   │   ├── audioFilter.js     # Filtro de notas de voz de WhatsApp/Telegram, audios de sistema y grabaciones
│   │   ├── libraryOrganizer.js# Agrupación por Artista -> Álbum -> Canción
│   │   ├── id3Parser.js       # Extracción manual de etiquetas ID3v2/v1
│   │   ├── metadata.js        # Interfaz unificada de extracción de metadatos de audio
│   │   ├── artwork.js         # Sanitización y compresión de carátulas para evitar desbordes
│   │   ├── fuzzyMatch.js      # Coeficiente de Sørensen-Dice para coincidencia de títulos/artistas
│   │   └── trackFilter.js     # Búsqueda multicriterio insensible a mayúsculas y acentos
│   ├── constants/             # Constantes, configuraciones estáticas y animaciones
│   │   ├── config.js          # Parámetros de OAuth y configuración general
│   │   ├── tracks.js          # Pistas locales de fallback / demo inicial
│   │   └── animations.js      # Configuración de timings y animaciones estándar de React Native
│   └── styles/                # Hojas de estilo desacopladas (`StyleSheet.create`)
│       ├── App.styles.js
│       ├── PlayerCard.styles.js
│       ├── MiniPlayer.styles.js
│       ├── Controls.styles.js
│       ├── QueueList.styles.js
│       ├── library/           # Estilos específicos de las pestañas de biblioteca
│       └── ...
├── src/web/                   # Versión Web independiente (Cero impacto en móvil)
│   ├── App.js                 # Contenedor principal de la versión Web
│   ├── components/            # WebNavbar, WebSidebar, WebTrackList, WebPlayerBottomBar, etc.
│   ├── hooks/                 # useWebPlayer, useWebDrive, useWebLyrics
│   ├── services/              # webAudioPlayer (HTML5), webDrive (OAuth/Stream), webCache, webLyrics
│   └── styles/                # web.styles.js (layout de escritorio, flexbox, tema oscuro)
├── app.config.js              # Configuración dinámica de Expo (Permissions, Schemes, IDs)
├── App.js                     # Punto de entrada de la interfaz de usuario móvil
├── index.js                   # Punto de entrada nativo de Android/iOS (TrackPlayer service)
├── index.web.js               # Punto de entrada web de Expo (Metro Web bundler)
├── service.js                 # Servicio de reproducción en segundo plano para TrackPlayer
├── package.json               # Dependencias y scripts
├── README.md                  # Documentación principal en español para desarrolladores
└── TODO.md                    # Bitácora de trabajo, estado de implementación y roadmap
```

---

## ⚡ 4. Patrones Arquitectónicos y Decisiones Técnicas Críticas

Al realizar cambios en Vulpis, se **deben** respetar las siguientes decisiones arquitectónicas:

### 4.1. Polling JSI Activo vs Eventos Nativos
- **Problema:** En `@rntp/player` (v5.6+) en Android, los eventos nativos (`DeviceEventEmitter` / `PlaybackTrackChanged`) a menudo sufren pérdidas de eventos o silenciamiento durante transiciones rápidas o modo en segundo plano.
- **Solución implementada:** En `usePlayerStateSync.js`, se utiliza un intervalo de **polling activo a 250ms**.
- **Por qué no impacta la batería ni la fluidez:** Las funciones `TrackPlayer.getActiveMediaItem()` y `TrackPlayer.getProgress()` están implementadas sobre **JSI (JavaScript Interface) en C++**, por lo que la lectura es directa y síncrona en memoria, sin latencia del puente tradicional de React Native.
- **Salvaguarda de Reordenamiento:** Durante operaciones de drag-and-drop o reordenamiento de la cola, se activa la referencia `isReorderingRef.current = true` para evitar que el ciclo de polling de 250ms pise o revierta temporalmente el estado visual de la cola antes de que la promesa nativa termine.

### 4.2. Prevención de Condiciones de Carrera (`isProcessing`)
- Los métodos asíncronos de `TrackPlayer` (`skipToNext`, `skipToPrevious`, `play`, `pause`, `setMediaItems`) devuelven promesas nativas.
- Para evitar llamadas solapadas que bloqueen ExoPlayer o desincronicen el índice activo, todos los disparadores de UI consultan y activan la bandera `isProcessing`. Cualquier interacción táctil duplicada se descarta hasta que la promesa nativa se resuelva.

### 4.3. Google Drive: Problema de Redirección Cross-Domain y Caché en Demanda
- **El Problema:** Al reproducir directamente desde `https://www.googleapis.com/drive/v3/files/{id}?alt=media` con cabecera `Authorization: Bearer <token>`, los servidores de Google emiten una redirección HTTP 302 hacia un subdominio `*.googleusercontent.com`. Por especificación de seguridad, **ExoPlayer en Android descarta la cabecera `Authorization`** al cambiar de dominio, provocando un error `403 Forbidden` y dejando el reproductor congelado en estado de búfer permanente.
- **La Solución en Vulpis:**
  1. No se realiza streaming directo con cabeceras HTTP hacia ExoPlayer para archivos de Drive.
  2. Se utiliza `expo-file-system/legacy` (`FileSystem.createDownloadResumable`), que gestiona correctamente la sesión autenticada y sigue la redirección descargando el archivo al `FileSystem.cacheDirectory`.
  3. Se pasa a `TrackPlayer` una URI local (`file:///...`), logrando reproducción instantánea y soporte offline automático para canciones escuchadas previamente.

### 4.4. Prevención del Desbordamiento de SQLite en Android (`CursorWindow`)
- **El Problema:** `AsyncStorage` en Android se apoya en una base de datos SQLite con una limitación de ventana de lectura por fila de ~2MB (`CursorWindow requiredPos=0, totalRows=1`). Si se guardan cadenas Base64 completas de carátulas ID3 de alta resolución en la cola o en el estado persistente (`vulpis_player_state`, `vulpis_playlists`), la aplicación arrojará excepciones críticas e irrecuperables al iniciar.
- **Regla Estricta:**
  - **NUNCA almacenar cadenas base64 gigantes en AsyncStorage**.
  - Utilizar `src/utils/artwork.js` para extraer las carátulas, guardarlas en el sistema de archivos temporal/caché como archivo `.jpg` y almacenar únicamente la URI local (`file:///...`) o la ruta al asset estático (`default-cover.jpg`).

### 4.5. Filtro Inteligente de Audio Local (`audioFilter.js`)
- El escaneo local con `expo-media-library` o carpetas de almacenamiento puede contaminar la biblioteca con miles de notas de voz de WhatsApp, audios de Telegram, grabaciones de llamadas (`Call_*`, `PTT-*`, `AUD-*`) y efectos de sonido del sistema.
- Toda pista escaneada pasa obligatoriamente por `isMusicalAudioTrack(track)`:
  - Se descartan duraciones inferiores a 15 segundos.
  - Se descartan rutas o nombres que contengan carpetas de mensajería (`WhatsApp`, `Telegram`, `Messenger`, `Discord`, `VoiceRecorder`, `SoundRecorder`, etc.).

### 4.6. Motor de Letras (Cascada de Prioridad y Sincronización)
- La búsqueda de letras para cualquier canción sigue una cascada estricta:
  1. **Letras incrustadas en metadatos locales (ID3 USLT/SYLT):** Máxima prioridad, lectura local inmediata.
  2. **Caché persistente local (`vulpis_cached_lyrics`):** Letras previamente obtenidas de la web.
  3. **LRCLIB API (`https://lrclib.net/api/get`):** Si "Buscar letras en línea" está habilitado en Configuración, busca mediante `track_name`, `artist_name`, `album_name` y `duration`.
  4. **Búsqueda difusa (Fuzzy Matching):** Si no hay coincidencia exacta, se consulta `/api/search` y se filtra con Coeficiente Sørensen-Dice (`> 0.65`).
  5. **Fallback:** Mensaje "Letra no encontrada" y opción de agregar/editar letra manualmente.
- Para letras sincronizadas (`.lrc`), `useSyncedLyrics.js` implementa auto-scroll con detección de desplazamiento manual del usuario y la funcionalidad **Tap-to-Seek** para saltar la reproducción al compás seleccionado.

### 4.7. Arquitectura de la Versión Web (`src/web/`)
- **Cero Impacto en Móvil:** Se utiliza `index.web.js` como punto de entrada exclusivo para Metro en Web. En Android e iOS, el empaquetador continúa resolviendo `index.js` y `@rntp/player` sin alteraciones ni sobrecarga.
- **Motor de Audio Web:** La clase `WebAudioPlayer` (`src/web/services/webAudioPlayer.js`) envuelve el elemento HTML5 `<audio>` soportando reproducción, pausas, seeking, shuffle, repeat y cola dinámica sin depender de ExoPlayer ni C++.
- **Streaming y CORS de Google Drive:** Para reproducir archivos protegidos con token Bearer en el navegador sin problemas de headers en `<audio>`, se utiliza `getWebAudioBlobUrl`:
  1. Consulta la caché local del navegador con la **Cache Storage API** (`vulpis-web-audio-v1`).
  2. Si no está en caché, realiza `fetch` con cabecera `Authorization: Bearer <token>`, guarda el `Blob` en caché y devuelve un `URL.createObjectURL(blob)`.
- **Metadatos y Carátulas ID3 en Web:** Se utiliza `jsmediatags/dist/jsmediatags.min.js` para leer etiquetas ID3 y portadas directamente sobre los Blobs descargados.
- **Letras Sincronizadas Web:** `webLyrics.js` parsea formatos `.lrc` y consulta LRCLIB directamente en el navegador con soporte de auto-scroll y salto temporal interactivo.

---

## 🚀 5. Flujos de Trabajo y Comandos de Desarrollo

### 5.1. Variables de Entorno (`.env`)
Crear un archivo `.env` en la raíz (ignorado por `.gitignore`):
```env
# Cliente OAuth para la App Móvil (iOS / Android)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu_cliente_oauth_de_google.apps.googleusercontent.com

# Cliente OAuth para la App Web (Aplicación web con origen http://localhost:8081)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu_cliente_web_oauth.apps.googleusercontent.com
```

### 5.2. Comandos de Terminal Más Usados

| Tarea | Comando | Notas |
| :--- | :--- | :--- |
| **Iniciar Versión Web** | `npm run web` | Servidor web en `http://localhost:8081` |
| **Compilar Versión Web** | `npm run build:web` | Genera estáticos en `dist/` |
| **Desplegar a Firebase** | `npm run deploy:web` | Publica en `https://vulpis.web.app` |
| **Iniciar Metro Bundler** | `npm start` o `npx expo start` | Servidor de desarrollo |
| **Ejecutar en Android Físico** | `npm run android` o `npx expo run:android` | Requiere dispositivo con depuración USB y Java 21 |
| **Ejecutar en iOS** | `npm run ios` | Requiere macOS y CocoaPods configurados |
| **Generar APK Release Local** | `npm run apk:release` | Binario en `android/app/build/outputs/apk/release/app-release.apk` |
| **Generar APK Debug Local** | `npm run apk:debug` | Binario en `android/app/build/outputs/apk/debug/app-debug.apk` |
| **EAS Build Preview (Nube)** | `npx eas build -p android --profile preview` | Compilación remota de APK con EAS |
| **EAS Build Local** | `npx eas build -p android --profile preview --local` | Compilación de APK usando EAS en la máquina local |

### 5.3. Configuración del Entorno de Compilación en Linux
Asegurarse de que el shell apunte a **Java 21** y al SDK de Android:
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
```

---

## 📐 6. Convenciones de Código y Buenas Prácticas

1. **Separación de Responsabilidades:**
   - **Componentes (`src/components/`):** Enfocados estrictamente en renderizado de UI, recepción de props y disparar callbacks. Evitar declaraciones de efectos o lógica pesada de persistencia dentro de los componentes visuales.
   - **Controladores / Custom Hooks (`src/hooks/`):** Toda la lógica de negocio, timers, suscripciones de eventos y estado reside en hooks custom.
   - **Estilos (`src/styles/`):** Ningún componente debe definir hojas de estilo gigantes al pie de su archivo. Todos los estilos deben ubicarse en `src/styles/[NombreComponente].styles.js`.
2. **Idioma:**
   - Todo el código nuevo (mensajes de Toast, alertas al usuario, comentarios de documentación, logs de consola y etiquetas visuales) **debe escribirse en Español**, manteniendo la coherencia de la refactorización ya completada.
3. **Manejo de Errores Silencioso y Resiliente:**
   - Operaciones de I/O, descargas de red, parseos de ID3 y llamadas a `AsyncStorage` deben estar siempre envueltas en bloques `try/catch` con logs claros (`console.warn` o `console.error` descriptivos) sin interrumpir la reproducción activa del usuario.
4. **Preservación de Comentarios:**
   - Conservar los comentarios explicativos y arquitectónicos existentes al modificar archivos.

---

## 🗺️ 7. Roadmap y Tareas Pendientes (`TODO.md`)

Al planear nuevas características para Vulpis, consultar el archivo [`TODO.md`](file:///home/anthofu/Escritorio/git/Vulpis/TODO.md). Entre las tareas más relevantes planificadas se encuentran:
- **Ecualizador de Audio (EQ):** Configuración de bandas y presets (Rock, Pop, Jazz, Bass Boost).
- **Ordenamiento Multicriterio:** Ordenar por Título, Artista, Álbum, Duración o Fecha de adición.
- **Exportación e Importación de Playlists:** Compatibilidad con formatos `.m3u` y `.json`.
- **Editor de Etiquetas ID3 (Tag Editor):** Edición directa de metadatos en archivos MP3 locales.
- **Migración a `@shopify/flash-list`:** Reemplazo de `FlatList` para bibliotecas con miles de canciones.
- **Migración Progresiva a TypeScript:** Definición de modelos (`Track`, `Playlist`, `AudioSettings`).
- **Selector de Temas Visuales:** AMOLED Black, Violeta Vulpis y Tema Dinámico basado en carátula.
