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
        var isRunning: Boolean = false
        var isPaused: Boolean = true
        var timerType: String = "interval"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var intervals: List<NativeInterval> = emptyList()
    private var currentIndex = 0
    private var intervalStartTime = 0L
    private var remainingBeforePause = 0L
    private var lastNotificationUpdateTime = 0L
    private var beep: MediaPlayer? = null
    private var ping: MediaPlayer? = null
    private var shouldLoop = true

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


    if (intent.hasExtra("timerType")) {
        timerType = intent.getStringExtra("timerType") ?: "interval"
    }

    if (intent.hasExtra("repeat")) {
        shouldLoop = intent.getBooleanExtra("repeat", true)
    }

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

    if (intent.getBooleanExtra("skip", false)) {
        skipToNext()
    }

    if (intent.getBooleanExtra("skipForward", false)) {
        val ms = intent.getDoubleExtra("skipForwardMs", 10000.0)
        skipForward(ms)
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
        isRunning = true
        isPaused = false
        sendResumedToJS()
        
        // Calculate start time based on the saved remaining time
        intervalStartTime = System.currentTimeMillis() - 
            (intervals[currentIndex].durationMs - remainingBeforePause)
        
        // Reset this so it doesn't interfere with future skips
        remainingBeforePause = 0L 

        handler.post(tickRunnable)
        // ... rest of your code
    }

    private fun skipToNext() {
        if (intervals.isEmpty()) return 

        // 1. Move to next index
        currentIndex++ 
        if (currentIndex >= intervals.size) {
            currentIndex = 0
        }

        val nextInterval = intervals[currentIndex]

        // 2. Fix the Pause Logic
        if (isPaused) {
            remainingBeforePause = nextInterval.durationMs
            sendPausedToJS()
        } else {
            // If running, simply reset the start anchor to "now"
            intervalStartTime = System.currentTimeMillis()
        }

        // 3. Audio Feedback
        beep?.let { if (!it.isPlaying) it.start() }

        // 4. Update UI Layers
        sendUpdateToJS(nextInterval.name, nextInterval.durationMs)
        updateNotification(nextInterval.durationMs) 
    }

    private fun skipForward(ms: Double) {
        if (intervals.isEmpty()) return

        if (isPaused) {
            if (remainingBeforePause < ms.toLong()) {
                remainingBeforePause = 0
            } else {
                remainingBeforePause -= ms.toLong()  // 👈
            }
            sendUpdateToJS(intervals[currentIndex].name, remainingBeforePause)
        } else {
            val remaining = intervals[currentIndex].durationMs - (System.currentTimeMillis() - intervalStartTime)
            if (remaining < ms.toLong()) {
                isRunning = false
                handler.removeCallbacksAndMessages(null)
                sendStoppedToJS()
                handler.postDelayed({ stopSelf() }, 1000)
                return
            } else {
                intervalStartTime -= ms.toLong()  // 👈
            }
        }
    }




    private fun startEngine() {
        isRunning = true
        isPaused = false
        remainingBeforePause = 0L
        currentIndex = 0
        lastBeepSecond = -1L 
        intervalStartTime = System.currentTimeMillis()
        handler.post(tickRunnable)
    }

    private fun resetEngine() {
        isRunning = false
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
            putString("timerType", timerType)
        }

        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalUpdate", params)
    }

    private fun sendPausedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)  
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalPaused", params)
    }

    private fun sendResumedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)  
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalResumed", params)
    }

    private fun sendStoppedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)  
        }

        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalStopped", params)
    }


    private var lastBeepSecond = -1L

    private val tickRunnable = object : Runnable {
        override fun run() {

            if (!isRunning || intervals.isEmpty() || isPaused) return

            val now = System.currentTimeMillis()
            val current = intervals[currentIndex]
            val elapsed = now - intervalStartTime
            val remaining = current.durationMs - elapsed

            val currentSecond = Math.ceil(remaining.toDouble() / 1000.0).toLong()

            if (currentSecond in 1..3 && currentSecond != lastBeepSecond) {
                ping?.let { if  (!it.isPlaying) it.start()}
                lastBeepSecond = currentSecond
            }

            sendUpdateToJS(current.name, remaining)

            if (now - lastNotificationUpdateTime >= 1000) {
                updateNotification(remaining)
                lastNotificationUpdateTime = now
            }


            if (remaining <= 0) {
                beep?.let { if  (!it.isPlaying) it.start()}
                lastBeepSecond = -1L 
                
                if (!shouldLoop && currentIndex == intervals.size -1){
                    isRunning = false
                    handler.removeCallbacksAndMessages(null)
                    sendStoppedToJS()
                    handler.postDelayed({  
                        stopSelf()
                    }, 1000)
                    return
                }

                currentIndex = (currentIndex + 1) % intervals.size
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
        val text = if (timerType == "random") "Random timer paused" else "Paused • ${formatTime(remainingMs)}"
        builder.setContentText(text)
        builder.addAction(R.drawable.play_sharp_white, "Resume", resumePending)
    } else {
        val text = if (timerType == "random") "Random timer running" else "Running • ${formatTime(remainingMs)}"
        builder.setContentText(text)
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