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
  - [x] Cascada de prioridad en [`usePlayerCard`](file:///home/anthofu/Escritorio/git/Vulpis/src/hooks/usePlayerCard.js#L37): ID3 locales -> Caché local -> API pública en línea -> "Letra no encontrada".

---

# Mejoras por hacer

- [ ] **Temporizador de Apagado (Sleep Timer):** Opción para detener la reproducción automáticamente después de X minutos (15m, 30m, 60m o al finalizar la pista actual).
- [ ] **Ecualizador de Audio (EQ):** Ecualizador con presets integrados (Rock, Pop, Jazz, Bass Boost, etc.).
- [ ] **Fundido Cruzado (Crossfade):** Transición suave entre canciones para evitar pausas o cortes bruscos al cambiar de pista.
- [ ] **Normalización de Volumen (ReplayGain):** Mantener un nivel de volumen uniforme entre pistas de distintos álbumes o fuentes.
- [ ] **Búsqueda Instantánea y Filtrado:** Barra de búsqueda en la biblioteca para filtrar rápidamente por Título, Artista, Álbum o Género.
- [ ] **Sistema de Favoritos ("Me Gusta"):** Botón de acceso rápido (corazón) para añadir/quitar canciones a una lista automática de "Favoritos".
- [ ] **Organización por Pestañas:** Vistas divididas por Canciones, Árbol de Artistas, Álbumes y Listas de Reproducción.
- [ ] **Ordenamiento Multicriterio:** Opción para ordenar listas por Nombre, Artista, Duración, Fecha de adición o Número de reproducciones.
- [ ] **Exportación e Importación de Playlists:** Respaldar y compartir listas de reproducción en formato `.m3u` o `.json`.
- [ ] **Historial de Reproducción:** Sección para consultar las canciones escuchadas recientemente.
- [ ] **Auto-scroll y Resaltado en Letras Sincronizadas (.lrc):** Desplazamiento automático interactivo conforme avanza la canción con resaltado de la línea actual.
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
- [ ] **Migración Gradual a TypeScript:** Añadir tipado estricto para modelos de datos (`Track`, `Playlist`), hooks e interfaces de servicios.
- [ ] **Suite de Pruebas Unitarias (Jest):** Implementar tests para lógica crítica como `drive.js`, `metadata.js` y `onlineLyrics.js`.