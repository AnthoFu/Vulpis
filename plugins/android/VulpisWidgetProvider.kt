package com.anthofu.Vulpis

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.*
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.view.KeyEvent
import android.view.View
import android.widget.RemoteViews
import kotlinx.coroutines.*
import java.io.File

/**
 * AppWidgetProvider para el widget de reproducción de Vulpis en la pantalla de inicio de Android.
 * Muestra el título, artista, carátula y controles de reproducción (Anterior, Play/Pausa, Siguiente).
 */
class VulpisWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val title = prefs.getString(KEY_TITLE, context.getString(R.string.widget_default_title)) ?: context.getString(R.string.widget_default_title)
        val artist = prefs.getString(KEY_ARTIST, context.getString(R.string.widget_default_artist)) ?: context.getString(R.string.widget_default_artist)
        val album = prefs.getString(KEY_ALBUM, "") ?: ""
        val artworkUrl = prefs.getString(KEY_ARTWORK_URL, null)
        val isPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)

        for (widgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId, title, artist, album, artworkUrl, isPlaying)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action ?: return

        when (action) {
            ACTION_WIDGET_PLAY_PAUSE -> {
                dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
                VulpisWidgetModule.sendEventToJs("onWidgetAction", "play_pause")

                // Feedback visual optimista inmediato
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val currentPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)
                val newPlaying = !currentPlaying
                prefs.edit().putBoolean(KEY_IS_PLAYING, newPlaying).apply()
                updateAllWidgetsFromPrefs(context)
            }
            ACTION_WIDGET_NEXT -> {
                dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_NEXT)
                VulpisWidgetModule.sendEventToJs("onWidgetAction", "next")
            }
            ACTION_WIDGET_PREV -> {
                dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_PREVIOUS)
                VulpisWidgetModule.sendEventToJs("onWidgetAction", "prev")
            }
        }
    }

    private fun dispatchMediaKey(context: Context, keyCode: Int) {
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            audioManager?.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
        } catch (e: Exception) {
            // Manejo silencioso en caso de restricciones de permisos del sistema
        }
    }

    companion object {
        const val PREFS_NAME = "vulpis_widget_prefs"
        const val KEY_TITLE = "title"
        const val KEY_ARTIST = "artist"
        const val KEY_ALBUM = "album"
        const val KEY_ARTWORK_URL = "artwork_url"
        const val KEY_IS_PLAYING = "is_playing"

        const val ACTION_WIDGET_PLAY_PAUSE = "com.anthofu.Vulpis.ACTION_WIDGET_PLAY_PAUSE"
        const val ACTION_WIDGET_NEXT = "com.anthofu.Vulpis.ACTION_WIDGET_NEXT"
        const val ACTION_WIDGET_PREV = "com.anthofu.Vulpis.ACTION_WIDGET_PREV"

        /**
         * Actualiza todos los widgets instalados en la pantalla de inicio con los nuevos datos de la pista.
         */
        fun updateAllWidgets(
            context: Context,
            title: String,
            artist: String,
            album: String,
            artworkUrl: String?,
            isPlaying: Boolean
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(KEY_TITLE, title)
                .putString(KEY_ARTIST, artist)
                .putString(KEY_ALBUM, album)
                .putString(KEY_ARTWORK_URL, artworkUrl)
                .putBoolean(KEY_IS_PLAYING, isPlaying)
                .apply()

            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, VulpisWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (widgetId in widgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId, title, artist, album, artworkUrl, isPlaying)
            }
        }

        private fun updateAllWidgetsFromPrefs(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val title = prefs.getString(KEY_TITLE, context.getString(R.string.widget_default_title)) ?: context.getString(R.string.widget_default_title)
            val artist = prefs.getString(KEY_ARTIST, context.getString(R.string.widget_default_artist)) ?: context.getString(R.string.widget_default_artist)
            val album = prefs.getString(KEY_ALBUM, "") ?: ""
            val artworkUrl = prefs.getString(KEY_ARTWORK_URL, null)
            val isPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)

            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, VulpisWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (widgetId in widgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId, title, artist, album, artworkUrl, isPlaying)
            }
        }

        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            widgetId: Int,
            title: String,
            artist: String,
            album: String,
            artworkUrl: String?,
            isPlaying: Boolean
        ) {
            val views = RemoteViews(context.packageName, R.layout.vulpis_widget_layout)

            views.setTextViewText(R.id.widget_title, title)
            views.setTextViewText(R.id.widget_artist, artist)

            if (album.isNotBlank()) {
                views.setTextViewText(R.id.widget_album, album)
                views.setViewVisibility(R.id.widget_album, View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_album, View.GONE)
            }

            // Icono de reproducir / pausar
            views.setImageViewResource(
                R.id.widget_btn_play_pause,
                if (isPlaying) R.drawable.ic_widget_pause else R.drawable.ic_widget_play
            )

            // PendingIntent para abrir la aplicación al tocar el cuerpo del widget
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                getPendingIntentFlags()
            )
            views.setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent)

            // PendingIntent para Anterior
            val prevIntent = Intent(context, VulpisWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_PREV
            }
            val prevPendingIntent = PendingIntent.getBroadcast(
                context,
                1,
                prevIntent,
                getPendingIntentFlags()
            )
            views.setOnClickPendingIntent(R.id.widget_btn_prev, prevPendingIntent)

            // PendingIntent para Play / Pausa
            val playPauseIntent = Intent(context, VulpisWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_PLAY_PAUSE
            }
            val playPausePendingIntent = PendingIntent.getBroadcast(
                context,
                2,
                playPauseIntent,
                getPendingIntentFlags()
            )
            views.setOnClickPendingIntent(R.id.widget_btn_play_pause, playPausePendingIntent)

            // PendingIntent para Siguiente
            val nextIntent = Intent(context, VulpisWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_NEXT
            }
            val nextPendingIntent = PendingIntent.getBroadcast(
                context,
                3,
                nextIntent,
                getPendingIntentFlags()
            )
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)

            // Procesar carátula
            setArtwork(context, views, artworkUrl)

            appWidgetManager.updateAppWidget(widgetId, views)
        }

        private fun setArtwork(context: Context, views: RemoteViews, artworkUrl: String?) {
            if (artworkUrl.isNullOrBlank()) {
                views.setImageViewResource(R.id.widget_artwork, R.drawable.widget_artwork_placeholder)
                return
            }

            try {
                val cleanPath = when {
                    artworkUrl.startsWith("file://") -> artworkUrl.substring(7)
                    else -> artworkUrl
                }
                val file = File(cleanPath)
                if (file.exists() && file.canRead()) {
                    val rawBitmap = BitmapFactory.decodeFile(file.absolutePath)
                    if (rawBitmap != null) {
                        val rounded = getRoundedCornerBitmap(rawBitmap, 24f)
                        views.setImageViewBitmap(R.id.widget_artwork, rounded)
                        return
                    }
                }
            } catch (e: Exception) {
                // Si falla la decodificación, fallback a placeholder
            }

            views.setImageViewResource(R.id.widget_artwork, R.drawable.widget_artwork_placeholder)
        }

        private fun getRoundedCornerBitmap(bitmap: Bitmap, cornerRadiusPx: Float): Bitmap {
            val output = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            val rect = Rect(0, 0, bitmap.width, bitmap.height)
            val rectF = RectF(rect)

            canvas.drawRoundRect(rectF, cornerRadiusPx, cornerRadiusPx, paint)
            paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
            canvas.drawBitmap(bitmap, rect, rect, paint)
            return output
        }

        private fun getPendingIntentFlags(): Int {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        }
    }
}
