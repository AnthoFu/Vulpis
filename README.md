# Vulpis 🦊

Este proyecto está desarrollado con **React Native** y **Expo**.

---

## Guía de Configuración y Ejecución en Dispositivo Físico (Vía USB)

Si tu computadora tiene recursos limitados o no deseas usar emuladores pesados como Android Studio, la mejor opción es ejecutar el proyecto directamente en tu teléfono físico a través de depuración USB.

A continuación, se detalla el paso a paso para configurar tu entorno en Linux (Bash/Zsh) y correr la aplicación:

### 1. Configuración del Entorno en la Computadora (Linux)

Asegúrate de tener definidas las variables de entorno en tu archivo de configuración de terminal (ej. `~/.bashrc` o `~/.zshrc`). Las variables deben apuntar al SDK local y a la versión correcta de Java (**Java 21** para evitar problemas de compatibilidad con Gradle):

Abre tu archivo `~/.bashrc` (o ejecuta `nano ~/.bashrc`) y asegúrate de agregar las siguientes líneas al final:

```bash
# Configuración del Android SDK
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
```

Guarda los cambios y recarga la terminal con:
```bash
source ~/.bashrc
```

---

### 2. Configuración en tu Teléfono Android

Antes de conectar tu teléfono, debes habilitar los permisos necesarios:

1. **Activar las Opciones de Desarrollador:**
   * Entra a **Ajustes** -> **Acerca del teléfono** (o *Información del dispositivo*).
   * Busca la línea **Número de compilación** (o *Versión de MIUI/OS* en teléfonos Xiaomi) y presiónala **7 veces seguidas** hasta que aparezca el aviso de que eres desarrollador.

2. **Habilitar la Depuración USB:**
   * Regresa al menú principal de Ajustes y entra a **Opciones de desarrollador** (suele estar en *Ajustes del sistema* o *Ajustes adicionales*).
   * Busca y activa la opción **Depuración USB** (USB Debugging).

3. **Permitir Instalación por USB:**
   * En el mismo menú de Opciones de desarrollador, busca y activa **Instalar vía USB** (o *Install via USB*). *Este paso es obligatorio en dispositivos Xiaomi, Redmi, POCO y Realme para permitir que la laptop envíe la aplicación al móvil*.

---

### 3. Conexión y Ejecución de la App

1. **Conecta tu teléfono a la computadora** mediante un cable USB.
2. Desbloquea tu teléfono. Debería aparecer una ventana emergente preguntando: **"¿Permitir depuración USB?"**. Marca la casilla de *"Permitir siempre desde esta computadora"* y pulsa **Aceptar**.
3. Abre una terminal en la raíz del proyecto y ejecuta el comando de inicio:
   ```bash
   npx expo run:android
   ```
4. **Durante la instalación:** Presta atención a la pantalla de tu móvil. Cuando el proceso en tu terminal esté finalizando y diga `Installing...`, aparecerá una advertencia de seguridad en tu teléfono: **"¿Instalar a través de USB?"**. Debes presionar **Instalar** (tienes un límite de 10 segundos).

¡Listo! La aplicación se abrirá automáticamente en tu teléfono móvil y cualquier cambio que realices en el código se actualizará instantáneamente.

---

## 🎵 Arquitectura del Reproductor de Audio (Vulpis Player)

Hemos implementado un reproductor de audio robusto que soporta reproducción en segundo plano, controles de notificación (pantalla de bloqueo) y compatibilidad total con la **Nueva Arquitectura** de React Native (React Native 0.85 / Expo 56). 

A continuación se detalla cómo está construido y las decisiones de diseño tomadas:

### 1. La Biblioteca: `@rntp/player` (v5.6+)
En versiones recientes de React Native, el *Bridge* (arquitectura legacy) ha sido removido. Bibliotecas clásicas como `react-native-track-player` v4 ya no compilan. Para Vulpis, usamos **`@rntp/player` v5.6+**, que es la reescritura moderna basada completamente en JSI (JavaScript Interface), Fabric y TurboModules. Esto nos brinda un rendimiento síncrono ultra-rápido para consultar datos del reproductor en C++.

### 2. Inicialización Diferida
En el archivo `index.js`, registramos el servicio asíncrono de audio de fondo (`service.js`) utilizando un callback diferido:
```javascript
TrackPlayer.registerPlaybackService(() => require('./service').default);
```
Esto evita fallos de hilo donde el módulo nativo intenta acceder al entorno JavaScript antes de que React Native esté totalmente montado.

### 3. Solución a la Sincronización de Interfaz (Polling JSI)
La versión 5 de TrackPlayer en Android tiene un *bug* donde el evento `DeviceEventEmitter` no emite correctamente las transiciones de pista a React. Por lo tanto, ganchos (hooks) como `useActiveMediaItem()` fallan y la interfaz no se actualiza automáticamente.

**Nuestra solución en `App.js`:**
1. **Polling Activo:** Dado que las funciones JSI son síncronas y tienen cero latencia (no cruzan un puente serializado), creamos un `setInterval` cada 250ms que consulta activamente el motor en C++/Kotlin:
   - `TrackPlayer.getActiveMediaItem()`
   - `TrackPlayer.isPlaying()`
   - `TrackPlayer.getProgress()`
2. **Propagación en Cascada:** Almacenamos esos datos en el estado central (`useState` en `App.js`) y lo inyectamos hacia abajo como propiedades (`props`) a los componentes visuales (`<PlayerCard />`, `<QueueList />`, `<Controls />`). Así evitamos que cada componente tenga que lidiar con lógica nativa.

### 4. Inicialización Resiliente y `skipToIndex(0)`
En un entorno de desarrollo (con *Fast Refresh*), la aplicación se recarga constantemente. Al hacer esto, el TrackPlayer ya estará montado en la RAM, lo que lanza el error `"Player is already set up"`.
En la función `init()` de `App.js`, capturamos silenciosamente este error para no quebrar el renderizado de la UI. 
Después de inyectar las pistas con `TrackPlayer.setMediaItems()`, ejecutamos `await TrackPlayer.skipToIndex(0)`. **Esto es obligatorio:** Si no seleccionamos activamente el índice 0 de la cola, ExoPlayer asume que no hay ninguna pista cargada y `getActiveMediaItem()` devuelve `undefined`.

### 5. Prevención de Concurrencia (Debouncing)
En `src/components/Controls.js` y `src/components/QueueList.js` hemos implementado un estado `isProcessing`. 
Al presionar Siguiente, Anterior o Play, establecemos `isProcessing = true`, lo cual desactiva (aplica `disabled` y una leve transparencia) todos los botones mientras los comandos asíncronos esperan la respuesta del reproductor de audio nativo. Esto previene *"race conditions"* (condiciones de carrera) y previene que los usuarios bloqueen la interfaz apretando mil veces "Siguiente" antes de que la canción siquiera termine de cargar el *buffer*.

### 6. Estructura de Componentes
El código se ha refactorizado para ser totalmente modular y limpio:
- **`App.js`**: Controlador de estado maestro, inyector de dependencias nativas y *Layout Wrapper*.
- **`src/components/Controls.js`**: Botones de manipulación de playback (Play/Pause/Skip) con debounce nativo.
- **`src/components/ProgressBar.js`**: Renderiza la barra con `duration` y `position` de la canción en tiempo real.
- **`src/components/PlayerCard.js`**: Despliega el cover art interactivo y los metadatos de la pista actual.
- **`src/components/QueueList.js`**: Visualiza la lista de la cola, indicando cuál está sonando y permitiendo selección directa con un toque.
- **`src/constants/tracks.js`**: Almacena el diccionario / array base inicial con identificadores `mediaId`.--

