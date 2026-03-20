package com.agentperry.TimeItV2

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import androidx.core.app.NotificationCompat
import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.IBinder
import android.util.Log
import org.json.JSONArray

data class NativeInterval(
    val name: String,
    val durationMs: Long
)

class IntervalService : Service() {

    companion object {
        var reactContext: ReactApplicationContext? = null
    }

    private val handler = Handler(Looper.getMainLooper())
    private var intervals: List<NativeInterval> = emptyList()
    private var currentIndex = 0
    private var intervalStartTime = 0L
    private var remainingBeforePause = 0L
    private var isPaused = false
    private var lastNotificationUpdateTime = 0L
    private var beep: MediaPlayer? = null
    private var ping: MediaPlayer? = null

    override fun onCreate() {
        super.onCreate()

    
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "interval_channel",
                "Interval Timer",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        beep = MediaPlayer.create(this, R.raw.beep)
        ping = MediaPlayer.create(this, R.raw.countdown_beep_v3)
    }


    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent == null) return START_STICKY

    // 1. HANDLE JSON DATA
    if (intent.hasExtra("intervals")) {
        try {
            val json = intent.getStringExtra("intervals")!!
            val arr = JSONArray(json)
            intervals = (0 until arr.length()).map { i ->
                val obj = arr.getJSONObject(i)
                NativeInterval(
                    name = obj.getString("name"),
                    durationMs = obj.getLong("durationMs")
                )
            }
        } catch (e: Exception) {
            Log.e("IntervalService", "Error parsing intervals JSON", e)
        }
    }

    // 2. HANDLE ACTIONS (Notification / Receiver)
    when (intent.action) {
        "ACTION_PAUSE" -> {
            pauseEngine()
            return START_STICKY
        }
        "ACTION_RESUME" -> {
            resumeEngine()
            return START_STICKY
        }
        "ACTION_STOP" -> {
            resetEngine()
            sendStoppedToJS()
            stopSelf()
            return START_NOT_STICKY
        }
    }

    // 3. HANDLE EXTRAS (React Native Layer)
    if (intent.getBooleanExtra("start", false)) {
        startEngine()
        startForegroundService()
    }

    if (intent.getBooleanExtra("pause", false)) pauseEngine()
    if (intent.getBooleanExtra("resume", false)) resumeEngine()
    if (intent.getBooleanExtra("stop", false)) {
        resetEngine()
        sendStoppedToJS()
        stopSelf()
        return START_NOT_STICKY
    }
    
    if (intent.getBooleanExtra("toggle", false)) {
        if (isPaused) resumeEngine() else pauseEngine()
    }

    // FIXED SKIP LOGIC
    if (intent.getBooleanExtra("skip", false)) {
        skipToNext()
    }

    return START_STICKY
}


    private fun pauseEngine() {
        isPaused = true
        val now = System.currentTimeMillis()
        val current = intervals[currentIndex]
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed
        remainingBeforePause = current.durationMs - elapsed

        handler.removeCallbacks(tickRunnable)
        
        updateNotification(remaining)

        sendPausedToJS()
    }

    private fun resumeEngine() {

        isPaused = false
        intervalStartTime = System.currentTimeMillis() -
            (intervals[currentIndex].durationMs - remainingBeforePause)

        val current = intervals[currentIndex]
        val now = System.currentTimeMillis()
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed


        handler.post(tickRunnable)

        updateNotification(remaining)


        sendResumedToJS()
    }

    private fun skipToNext() {
    if (intervals.isEmpty()) return 

    currentIndex++ 
    if (currentIndex >= intervals.size) {
        currentIndex = 0
    }

    intervalStartTime = System.currentTimeMillis()
    remainingBeforePause = 0L 

    beep?.let { if (!it.isPlaying) it.start() }

    val nextInterval = intervals[currentIndex]
    sendUpdateToJS(nextInterval.name, nextInterval.durationMs)
    
    // FIX: ensure this says durationMs
    updateNotification(nextInterval.durationMs) 
}




    private fun startEngine() {
        isPaused = false
        remainingBeforePause = 0L
        currentIndex = 0
        intervalStartTime = System.currentTimeMillis()
        handler.post(tickRunnable)
    }

    private fun resetEngine() {
        handler.removeCallbacksAndMessages(null)
        isPaused = false
        currentIndex = 0
        intervalStartTime = 0L
        remainingBeforePause = 0L
    }


    private fun sendUpdateToJS(intervalName: String, remainingMs: Long) {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("intervalName", intervalName)
            putDouble("remainingMs", remainingMs.toDouble())
        }

        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalUpdate", params)
    }

    private fun sendPausedToJS() {
        val ctx = reactContext ?: return
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalPaused", null)
    }

    private fun sendResumedToJS() {
        val ctx = reactContext ?: return
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalResumed", null)
    }

    private fun sendStoppedToJS() {
        val ctx = reactContext ?: return
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalStopped", null)
    }


    private val tickRunnable = object : Runnable {
    
    override fun run() {

        if (intervals.isEmpty()) {
            return
        }
        
        if (isPaused) {
            return
        }


        val now = System.currentTimeMillis()
        val current = intervals[currentIndex]
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed

        sendUpdateToJS(current.name, remaining)

        if (now - lastNotificationUpdateTime >= 1000) {
            updateNotification(remaining)
            lastNotificationUpdateTime = now
        }


        if (remaining in 970..1030 ||
            remaining in 1970..2030 ||
            remaining in 2970..3030
        ) {
            ping?.let { if (!it.isPlaying) it.start() }
        }

        if (remaining <= 0) {
            beep?.let { if (!it.isPlaying) it.start() }
            currentIndex++

            if (currentIndex >= intervals.size) {
                currentIndex = 0
            }

            intervalStartTime = System.currentTimeMillis()
            updateNotification(intervals[currentIndex].durationMs)
        }

        handler.postDelayed(this, 50)
    }
}


    private fun startForegroundService() {
        val current = intervals[currentIndex]
        val now = System.currentTimeMillis()
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed

        val notification = buildNotification(false, remaining)
        startForeground(1, notification)
    }


private fun buildNotification(isPaused: Boolean, remainingMs: Long): Notification {

    val channelId = "interval_channel"

    val pauseIntent = Intent(this, IntervalActionReceiver::class.java).apply {
        action = "ACTION_PAUSE"
    }
    val pausePending = PendingIntent.getBroadcast(
        this, 0, pauseIntent, PendingIntent.FLAG_IMMUTABLE
    )

    val resumeIntent = Intent(this, IntervalActionReceiver::class.java).apply {
        action = "ACTION_RESUME"
    }
    val resumePending = PendingIntent.getBroadcast(
        this, 1, resumeIntent, PendingIntent.FLAG_IMMUTABLE
    )

    val stopIntent = Intent(this, IntervalActionReceiver::class.java).apply {
        action = "ACTION_STOP"
    }
    val stopPending = PendingIntent.getBroadcast(
        this, 2, stopIntent, PendingIntent.FLAG_IMMUTABLE
    )

    val skipIntent = Intent(this, IntervalActionReceiver::class.java).apply {
        action = "ACTION_SKIP"
    }

    val skipPending = PendingIntent.getBroadcast(
        this, 3, skipIntent, PendingIntent.FLAG_IMMUTABLE
    )

    // tapping notification body sends to app open 
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)

    val contentPendingIntent = PendingIntent.getActivity(
        this,
        0,
        launchIntent,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val builder = NotificationCompat.Builder(this, channelId)
        .setContentTitle("${intervals[currentIndex].name} timer")
        .setSmallIcon(R.drawable.notification_icon)
        .setContentIntent(contentPendingIntent)
        .setColor(android.graphics.Color.parseColor("#3892B8"))
        .setColorized(true)
        .setOngoing(true)
        .setShowWhen(false)
        .setOnlyAlertOnce(true) // Crucial to prevent "flickering" when folded
        .setCategory(NotificationCompat.CATEGORY_SERVICE) // Helps Android prioritize layout

    if (isPaused) {
        builder.setContentText("Paused • ${formatTime(remainingMs)}")
        builder.addAction(R.drawable.play_sharp_white, "Resume", resumePending)
    } else {
        builder.setContentText("Running • ${formatTime(remainingMs)}")
        builder.addAction(R.drawable.pause_sharp_white, "Pause", pausePending)
    }

    builder.addAction(R.drawable.stop_sharp_white, "Stop", stopPending)
    builder.addAction(R.drawable.play_skip_forward_sharp_white, "Skip", skipPending)

    // LIMIT compact actions
    // If you have too many actions, the text disappears. 
    // Show only the Play/Pause button (index 0) in compact view to save space for the timer.
    val style = androidx.media.app.NotificationCompat.MediaStyle()
        .setShowActionsInCompactView(0,2) // Show buttons in compact view

    builder.setStyle(style)

    return builder.build()
}


private fun updateNotification(remainingMs: Long) {
    val notification = buildNotification(isPaused, remainingMs)
    startForeground(1, notification)
}



private fun formatTime(ms: Long): String {
    val totalSeconds = ms / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%02d:%02d", minutes, seconds)
}

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        beep?.release()
        ping?.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}