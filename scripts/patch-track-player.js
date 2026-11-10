/**
 * Script de postinstalación para exponer de forma limpia e idempotente
 * el activeAudioSessionId y activeInstance en TrackPlayerPlaybackService.kt de @rntp/player.
 * Permite que el ecualizador nativo de Android (Equalizer y BassBoost) se acople
 * a la sesión de ExoPlayer y emita los broadcasts del sistema.
 */

const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@rntp',
  'player',
  'android',
  'src',
  'main',
  'java',
  'com',
  'doublesymmetry',
  'trackplayer',
  'TrackPlayerPlaybackService.kt'
);

if (!fs.existsSync(targetPath)) {
  console.log('[patch-track-player] Archivo TrackPlayerPlaybackService.kt no encontrado (¿instalación limpia?). Saltando parche.');
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');

if (content.includes('activeAudioSessionId')) {
  console.log('[patch-track-player] TrackPlayerPlaybackService.kt ya está parcheado.');
  process.exit(0);
}

console.log('[patch-track-player] Aplicando parche acústico a TrackPlayerPlaybackService.kt...');

// 1. Inyectar variables en companion object
content = content.replace(
  'companion object {',
  `companion object {
    @Volatile
    var activeAudioSessionId: Int = 0

    @Volatile
    var activeInstance: TrackPlayerPlaybackService? = null`
);

// 2. Inyectar activeInstance en onCreate()
content = content.replace(
  'super.onCreate()',
  `super.onCreate()
    activeInstance = this`
);

// 3. Capturar audioSessionId y emitir ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION
content = content.replace(
  'exoPlayer = built',
  `exoPlayer = built
    activeAudioSessionId = built.audioSessionId
    try {
      val openSessionIntent = android.content.Intent(android.media.audiofx.AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION).apply {
        putExtra(android.media.audiofx.AudioEffect.EXTRA_AUDIO_SESSION, built.audioSessionId)
        putExtra(android.media.audiofx.AudioEffect.EXTRA_PACKAGE_NAME, packageName)
        putExtra(android.media.audiofx.AudioEffect.EXTRA_CONTENT_TYPE, android.media.audiofx.AudioEffect.CONTENT_TYPE_MUSIC)
      }
      sendBroadcast(openSessionIntent)
    } catch (_: Exception) {}`
);

// 4. Limpiar en onDestroy()
content = content.replace(
  'override fun onDestroy() {',
  `override fun onDestroy() {
    if (activeAudioSessionId != 0) {
      try {
        val closeSessionIntent = android.content.Intent(android.media.audiofx.AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION).apply {
          putExtra(android.media.audiofx.AudioEffect.EXTRA_AUDIO_SESSION, activeAudioSessionId)
          putExtra(android.media.audiofx.AudioEffect.EXTRA_PACKAGE_NAME, packageName)
        }
        sendBroadcast(closeSessionIntent)
      } catch (_: Exception) {}
      activeAudioSessionId = 0
    }
    activeInstance = null`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('[patch-track-player] Parche aplicado con éxito a TrackPlayerPlaybackService.kt.');

// 5. Si existe la carpeta nativa android/, sincronizar los módulos nativos del ecualizador
const androidSrcDir = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'anthofu',
  'Vulpis'
);

if (fs.existsSync(androidSrcDir)) {
  const pluginSrcDir = path.join(__dirname, '..', 'plugins', 'android');
  const filesToCopy = ['VulpisEqualizerModule.kt', 'VulpisEqualizerPackage.kt'];
  for (const file of filesToCopy) {
    const src = path.join(pluginSrcDir, file);
    const dest = path.join(androidSrcDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  const mainAppPath = path.join(androidSrcDir, 'MainApplication.kt');
  if (fs.existsSync(mainAppPath)) {
    let mainApp = fs.readFileSync(mainAppPath, 'utf8');
    if (!mainApp.includes('VulpisEqualizerPackage()')) {
      mainApp = mainApp.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n          add(VulpisEqualizerPackage())`
      );
      fs.writeFileSync(mainAppPath, mainApp, 'utf8');
      console.log('[patch-track-player] VulpisEqualizerPackage registrado en MainApplication.kt.');
    }
  }
}

