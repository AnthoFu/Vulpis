package com.anthofu.Vulpis

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Módulo nativo para conectar el estado de reproducción de React Native
 * con el AppWidget de la pantalla de inicio de Android.
 */
class VulpisWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        companionReactContext = reactContext
    }

    override fun getName(): String {
        return "VulpisWidget"
    }

    /**
     * Actualiza la información de la pista y el estado de reproducción en todos los widgets activos.
     */
    @ReactMethod
    fun updateWidget(trackMap: ReadableMap?, isPlaying: Boolean) {
        val context = reactApplicationContext

        val title = trackMap?.getString("title") ?: context.getString(R.string.widget_default_title)
        val artist = trackMap?.getString("artist") ?: context.getString(R.string.widget_default_artist)
        val album = trackMap?.getString("album") ?: ""
        val artworkUrl = trackMap?.getString("artworkUrl")

        VulpisWidgetProvider.updateAllWidgets(
            context = context,
            title = title,
            artist = artist,
            album = album,
            artworkUrl = artworkUrl,
            isPlaying = isPlaying
        )
    }

    /**
     * Comprueba si el usuario tiene al menos un widget de Vulpis anclado en su pantalla de inicio.
     */
    @ReactMethod
    fun isWidgetActive(promise: Promise) {
        try {
            val context = reactApplicationContext
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, VulpisWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            promise.resolve(widgetIds.isNotEmpty())
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    companion object {
        private var companionReactContext: ReactApplicationContext? = null

        /**
         * Envía eventos desde el AppWidget a JavaScript (React Native).
         */
        fun sendEventToJs(eventName: String, params: Any?) {
            try {
                companionReactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, params)
            } catch (e: Exception) {
                // Si el motor JS está temporalmente suspendido o reiniciando, continuar
            }
        }
    }
}
