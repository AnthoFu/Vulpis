## 🚀 Siguientes Pasos (Roadmap sugerido)

Ahora que tenemos una base sólida, las siguientes características recomendadas para escalar Vulpis Player son:

1. **Barra de Progreso Interactiva (Slider):**
   - Reemplazar la actual barra estática por un componente deslizador (ej. `react-native-slider` o `react-native-gesture-handler`) para que el usuario pueda adelantar o retroceder la canción manualmente (usando `TrackPlayer.seekTo()`).
2. **[COMPLETADO] Obtención Dinámica de Canciones (Biblioteca Local):**
   - Dejar de usar `src/constants/tracks.js` estático y conectar la cola del reproductor a los archivos de audio locales del dispositivo (.mp3) usando `expo-media-library` y `expo-document-picker`, persistiendo la lista en `AsyncStorage`.
3. **Controles Avanzados:**
   - Añadir botones de **Aleatorio (Shuffle)** y **Repetir (Repeat)**.
   - Reflejar estos modos globalmente en el reproductor invocando `TrackPlayer.setRepeatMode()` y gestionando colas aleatorias.
4. **Persistencia de Estado:**
   - Guardar la última canción reproducida y el progreso usando `AsyncStorage` o `expo-sqlite`, para que cuando el usuario cierre y abra la app, retome la reproducción exactamente donde la dejó.
5. **Mejoras Visuales (Experiencia Premium):**
   - Extraer el color dominante de la portada de la canción (con librerías como `react-native-image-colors`) y animar el fondo de la aplicación (`PlayerCard`) para reaccionar al color del álbum actual.