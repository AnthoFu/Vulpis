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
 