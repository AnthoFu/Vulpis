package com.anthofu.Vulpis

import android.content.Intent
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import com.doublesymmetry.trackplayer.TrackPlayerPlaybackService
import com.facebook.react.bridge.*

/**
 * Módulo nativo de Android para el control acústico del Ecualizador y Refuerzo de Graves (Bass Boost).
 * Se acopla directamente a la sesión activa de ExoPlayer (Media3) expuesta por TrackPlayerPlaybackService.
 */
class VulpisEqualizerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var equalizer: Equalizer? = null
  private var bassBoost: BassBoost? = null
  private var attachedSessionId: Int = 0

  // Estado en memoria para re-acoplamiento automático cuando cambie la sesión de ExoPlayer
  private var lastEnabled: Boolean = false
  private var lastGains: IntArray = IntArray(5) { 0 }
  private var lastBassBoost: Int = 0

  override fun getName(): String {
    return "VulpisEqualizer"
  }

  /**
   * Obtiene el identificador de sesión de audio nativo actual.
   */
  @ReactMethod
  fun getAudioSessionId(promise: Promise) {
    try {
      val sessionId = TrackPlayerPlaybackService.activeAudioSessionId
      promise.resolve(sessionId)
    } catch (e: Exception) {
      promise.reject("ERR_AUDIO_SESSION", e.message, e)
    }
  }

  /**
   * Asegura la inicialización y acoplamiento de los efectos de audio a la sesión actual de ExoPlayer.
   */
  @Synchronized
  private fun ensureEffectsAttached(): Boolean {
    val targetSessionId = TrackPlayerPlaybackService.activeAudioSessionId
    if (targetSessionId == 0) {
      return false
    }

    if (equalizer != null && bassBoost != null && attachedSessionId == targetSessionId) {
      return true
    }

    releaseEffects()

    try {
      equalizer = Equalizer(1000, targetSessionId)
      bassBoost = BassBoost(1000, targetSessionId)
      attachedSessionId = targetSessionId
      applyCachedSettings()
      return true
    } catch (e: Exception) {
      android.util.Log.w("VulpisEqualizer", "No se pudo acoplar el ecualizador a la sesión $targetSessionId: ${e.message}")
      releaseEffects()
      return false
    }
  }

  @Synchronized
  private fun applyCachedSettings() {
    val eq = equalizer ?: return
    val bb = bassBoost ?: return
    try {
      eq.enabled = lastEnabled
      bb.enabled = lastEnabled

      if (lastEnabled) {
        val numBands = eq.numberOfBands.toInt()
        val range = eq.bandLevelRange
        val minLevel = range[0].toInt()
        val maxLevel = range[1].toInt()

        for (i in 0 until numBands) {
          if (i < lastGains.size) {
            val clampedMb = (lastGains[i] * 100).coerceIn(minLevel, maxLevel)
            eq.setBandLevel(i.toShort(), clampedMb.toShort())
          }
        }

        val strength = (lastBassBoost * 100).coerceIn(0, 1000).toShort()
        bb.setStrength(strength)
      }
    } catch (e: Exception) {
      android.util.Log.w("VulpisEqualizer", "Error al aplicar ajustes cacheados: ${e.message}")
    }
  }

  @Synchronized
  private fun releaseEffects() {
    try {
      equalizer?.release()
    } catch (_: Exception) {}
    try {
      bassBoost?.release()
    } catch (_: Exception) {}
    equalizer = null
    bassBoost = null
    attachedSessionId = 0
  }

  /**
   * Activa o desactiva el ecualizador y refuerzo de graves nativos.
   */
  @ReactMethod
  fun setEqualizerEnabled(enabled: Boolean, promise: Promise) {
    try {
      lastEnabled = enabled
      if (!ensureEffectsAttached()) {
        promise.resolve(false)
        return
      }

      equalizer?.enabled = enabled
      bassBoost?.enabled = enabled
      if (enabled) {
        applyCachedSettings()
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_EQ_ENABLED", e.message, e)
    }
  }

  /**
   * Ajusta la ganancia en dB (-10 a +10 dB) para una banda de frecuencia específica (0 a 4).
   */
  @ReactMethod
  fun setBandGain(bandIndex: Int, gainDb: Int, promise: Promise) {
    try {
      if (bandIndex in 0..4) {
        lastGains[bandIndex] = gainDb
      }

      if (!ensureEffectsAttached()) {
        promise.resolve(false)
        return
      }

      val eq = equalizer ?: run {
        promise.resolve(false)
        return
      }

      val numBands = eq.numberOfBands.toInt()
      if (bandIndex < 0 || bandIndex >= numBands) {
        promise.resolve(false)
        return
      }

      val range = eq.bandLevelRange // ej: [-1500, 1500] en mB
      val minLevel = range[0].toInt()
      val maxLevel = range[1].toInt()

      // 1 dB = 100 millibels
      val requestedMb = gainDb * 100
      val clampedMb = requestedMb.coerceIn(minLevel, maxLevel)

      eq.setBandLevel(bandIndex.toShort(), clampedMb.toShort())
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_EQ_BAND", e.message, e)
    }
  }

  /**
   * Configura todas las 5 bandas a la vez según un array de ganancias en dB.
   */
  @ReactMethod
  fun setAllBands(gains: ReadableArray, promise: Promise) {
    try {
      for (i in 0 until minOf(gains.size(), 5)) {
        lastGains[i] = gains.getInt(i)
      }

      if (!ensureEffectsAttached()) {
        promise.resolve(false)
        return
      }

      val eq = equalizer ?: run {
        promise.resolve(false)
        return
      }

      val numBands = eq.numberOfBands.toInt()
      val range = eq.bandLevelRange
      val minLevel = range[0].toInt()
      val maxLevel = range[1].toInt()

      for (i in 0 until numBands) {
        if (i < gains.size()) {
          val gainDb = gains.getInt(i)
          val clampedMb = (gainDb * 100).coerceIn(minLevel, maxLevel)
          eq.setBandLevel(i.toShort(), clampedMb.toShort())
        }
      }

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_EQ_ALL_BANDS", e.message, e)
    }
  }

  /**
   * Ajusta la intensidad del refuerzo de graves (Bass Boost) de 0 a 10 dB.
   */
  @ReactMethod
  fun setBassBoost(strengthDb: Int, promise: Promise) {
    try {
      lastBassBoost = strengthDb

      if (!ensureEffectsAttached()) {
        promise.resolve(false)
        return
      }

      val bb = bassBoost ?: run {
        promise.resolve(false)
        return
      }

      // Android BassBoost acepta fuerza entre 0 y 1000
      val strength = (strengthDb * 100).coerceIn(0, 1000).toShort()
      bb.setStrength(strength)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_BASS_BOOST", e.message, e)
    }
  }

  /**
   * Comprueba si el dispositivo tiene un panel de ecualización del sistema disponible.
   */
  @ReactMethod
  fun isSystemEqualizerAvailable(promise: Promise) {
    try {
      val intent = Intent(AudioEffect.ACTION_DISPLAY_AUDIO_EFFECT_CONTROL_PANEL)
      val pm = reactApplicationContext.packageManager
      val resolved = intent.resolveActivity(pm) != null
      promise.resolve(resolved)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /**
   * Abre el panel de control de ecualización del sistema Android (Dolby Atmos, Wavelet, etc.).
   */
  @ReactMethod
  fun openSystemEqualizer(promise: Promise) {
    try {
      val intent = Intent(AudioEffect.ACTION_DISPLAY_AUDIO_EFFECT_CONTROL_PANEL).apply {
        val sessionId = TrackPlayerPlaybackService.activeAudioSessionId
        if (sessionId != 0) {
          putExtra(AudioEffect.EXTRA_AUDIO_SESSION, sessionId)
        }
        putExtra(AudioEffect.EXTRA_PACKAGE_NAME, reactApplicationContext.packageName)
        putExtra(AudioEffect.EXTRA_CONTENT_TYPE, AudioEffect.CONTENT_TYPE_MUSIC)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      val pm = reactApplicationContext.packageManager
      if (intent.resolveActivity(pm) != null) {
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    } catch (e: Exception) {
      promise.reject("ERR_SYS_EQ", e.message, e)
    }
  }

  @ReactMethod
  fun release(promise: Promise) {
    releaseEffects()
    promise.resolve(true)
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    releaseEffects()
  }
}
