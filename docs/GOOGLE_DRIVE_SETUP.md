# 🦊 Integración de Nube Privada (Google Drive) en Vulpis

Este documento detalla el funcionamiento, la arquitectura y los pasos necesarios para habilitar y configurar la nueva característica de **Nube Privada** integrada con **Google Drive** en Vulpis.

---

## 📋 Resumen del Flujo de Trabajo (UX)

Para el usuario final de la aplicación, el proceso de sincronización es de **cero configuración (Zero-Config)**:
1. El usuario navega al menú lateral y selecciona **Nube Privada**.
2. Al estar desconectado, ve una tarjeta de presentación con un solo botón: **Conectar Google Drive**.
3. Al pulsarlo, se abre un navegador seguro en el móvil donde el usuario inicia sesión y autoriza a Vulpis a leer sus archivos de Drive.
4. El navegador se cierra automáticamente y la app muestra las canciones de su Drive listas para reproducirse por streaming.

---

## 🛠️ Guía de Configuración para el Desarrollador

Para que la característica funcione, tú (como desarrollador) debes registrar la aplicación en la consola de Google. Sigue estos pasos:

### 1. Registrar el Proyecto en Google Cloud Console
1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo llamado **Vulpis Player** (o selecciona uno existente).
3. En el menú de navegación, ve a **API y servicios** -> **Biblioteca**.
4. Busca **Google Drive API** y presiona **Habilitar**.

### 2. Configurar la Pantalla de Consentimiento OAuth
1. Ve a **API y servicios** -> **Pantalla de consentimiento de OAuth**.
2. Selecciona tipo de usuario **Externo** (para permitir cuentas personales de prueba) y presiona *Crear*.
3. Completa los campos básicos (Nombre de la app, correo de soporte) y avanza.
4. En **Permisos (Scopes)**, añade el siguiente permiso:
   - `https://www.googleapis.com/auth/drive.readonly` (para que la app solo pueda leer y transmitir archivos de audio, sin capacidad de modificarlos o eliminarlos).
5. En **Usuarios de prueba (Test users)**, añade tu correo personal de Google para poder iniciar sesión mientras el proyecto está en estado de "Prueba".

### 3. Crear Credenciales de Cliente (OAuth Client ID)
1. Ve a **API y servicios** -> **Credenciales**.
2. Presiona **+ Crear credenciales** -> **ID de cliente de OAuth**.
3. **Tipo de aplicación:**
   - **Para Android:** Selecciona *Android*. Configura tu nombre de paquete como `com.anthofu.Vulpis` y proporciona tu firma de huella digital SHA-1 (puedes obtenerla ejecutando `keytool -list -v -keystore ~/.android/debug.keystore` en tu computadora).
   - **Para iOS:** Selecciona *iOS*. Configura tu Bundle ID como `com.anthofu.Vulpis`.
   - **Para pruebas rápidas / Web:** Selecciona *Aplicación web*. Añade como **URI de redireccionamiento autorizado**:
     - `vulpis://oauth-redirect`
4. Copia el **ID de cliente** generado (Client ID).

### 4. Configurar las Credenciales en el Código de Vulpis
Abre el archivo [src/constants/config.js](file:///home/anthofu/Escritorio/git/Vulpis/src/constants/config.js) y reemplaza el marcador de posición con tu Client ID:

```javascript
export const GOOGLE_OAUTH_CONFIG = {
  // Reemplaza esto con tu Client ID real de Google
  clientId: 'TU_CLIENT_ID_REAL.apps.googleusercontent.com',
  redirectUri: 'vulpis://oauth-redirect',
};
```

---

## 🎵 Arquitectura y Decisiones de Diseño

La solución se construyó utilizando módulos oficiales y optimizaciones para evitar sobrecargar el almacenamiento local:

### 1. Autenticación Desacoplada (`expo-web-browser`)
Utilizamos `expo-web-browser` para abrir la sesión de autenticación directamente sobre los componentes nativos seguros (Chrome Custom Tabs en Android / Safari View Controller en iOS). El flujo redirige a la URL personalizada:
- `vulpis://oauth-redirect`

Esta URL es capturada por el sistema operativo móvil, el cual reabre Vulpis y le entrega el `access_token` en los fragmentos de la URL.

### 2. Transmisión Directa por Stream (Sin Descargas)
A diferencia de otras apps que descargan el archivo completo al almacenamiento del teléfono, Vulpis aprovecha la capacidad de **streaming con cabeceras personalizadas** de `@rntp/player`:
- Realizamos una petición HTTP directa al endpoint de descarga de Drive:
  `https://www.googleapis.com/drive/v3/files/<FILE_ID>?alt=media`
- Inyectamos en las opciones de reproducción del TrackPlayer el token de autorización:
  ```javascript
  headers: {
    Authorization: `Bearer ${accessToken}`,
  }
  ```
Esto permite que el reproductor nativo del sistema haga buffering de la canción en tiempo real directamente desde la nube privada del usuario.

### 3. Persistencia de Sesión
El token de acceso se almacena localmente en `AsyncStorage` junto con su marca de tiempo de expiración. Al iniciar la aplicación, si el token sigue siendo válido (vencimiento superior a 5 minutos), la app restaura automáticamente la sesión sin pedirle al usuario volver a loguearse.

---

## 📂 Archivos Involucrados

- [src/constants/config.js](file:///home/anthofu/Escritorio/git/Vulpis/src/constants/config.js): Archivo central para definir el Client ID de Google OAuth.
- [src/utils/drive.js](file:///home/anthofu/Escritorio/git/Vulpis/src/utils/drive.js): Módulo utilitario con toda la lógica de login, parseo de URLs, llamadas a la API de Drive y mapeo de pistas.
- [src/components/QueueList.js](file:///home/anthofu/Escritorio/git/Vulpis/src/components/QueueList.js): Renderiza el panel dinámico para conectar, refrescar la lista o desconectar Drive.
- [App.js](file:///home/anthofu/Escritorio/git/Vulpis/App.js): Controlador central que sincroniza los estados del reproductor con las credenciales de Drive.
- [src/components/SidebarDrawer.js](file:///home/anthofu/Escritorio/git/Vulpis/src/components/SidebarDrawer.js): Retirada la Nube Pública del menú y añadido el enlace a Drive.
- [src/constants/tracks.js](file:///home/anthofu/Escritorio/git/Vulpis/src/constants/tracks.js): Removidos los diccionarios estáticos de pistas públicas y NAS.
