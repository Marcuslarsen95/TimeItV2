package com.agentperry.criatimer

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
import android.speech.tts.TextToSpeech
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import java.util.Locale
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
        var remainingBeforePause: Long = 0L
        var instance: IntervalService? = null
        var shouldLoop: Boolean = false
        var voicePromptsEnabled: Boolean = false
        var isAlarmRinging: Boolean = false
        var totalPasses: Int = 1
        var completedPasses: Int = 0
    }

    private val handler = Handler(Looper.getMainLooper())
    private var intervals: List<NativeInterval> = emptyList()
    private var currentIndex = 0
    private var intervalStartTime = 0L
    private var lastNotificationUpdateTime = 0L
    private var beep: MediaPlayer? = null
    private var ping: MediaPlayer? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var mediaSession: MediaSessionCompat? = null

    override fun onCreate() {
        super.onCreate()
        instance = this

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

        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.UK
                tts?.setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                ttsReady = true
            } else {
                Log.w("IntervalService", "TTS init failed: $status")
            }
        }

        // MediaSession — exposes a "media playback" surface so paired smart
        // watches, headphones, and lock-screen controls can drive the timer
        // through the standard play/pause/skip media key events.
        //
        // We only expose play/pause/stop universally; skip-next is offered
        // only for the interval timer (where it makes sense as "next segment").
        // No skip-previous — there's no clean meaning for it.
        mediaSession = MediaSessionCompat(this, "CriaTimerSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay()  { resumeEngine() }
                override fun onPause() { pauseEngine() }
                override fun onStop() {
                    resetEngine()
                    sendStoppedToJS()
                    stopSelf()
                }
                override fun onSkipToNext() {
                    // Only meaningful for the interval timer. Other timer types
                    // don't advertise this action, so we shouldn't be called for
                    // them — but no-op defensively just in case.
                    if (timerType == "interval") skipToNext()
                }
            })
            isActive = true
        }
    }

    private fun updateMediaSession(remainingMs: Long) {
        val session = mediaSession ?: return

        val state = if (isPaused)
            PlaybackStateCompat.STATE_PAUSED
        else
            PlaybackStateCompat.STATE_PLAYING

        // Only expose actions we actually want surfaced on watches / lock-screen.
        // Skip-next only makes sense for the interval timer — random / countdown /
        // stopwatch don't have a meaningful "next" so we omit it.
        var actions = PlaybackStateCompat.ACTION_PLAY or
            PlaybackStateCompat.ACTION_PAUSE or
            PlaybackStateCompat.ACTION_PLAY_PAUSE or
            PlaybackStateCompat.ACTION_STOP

        if (timerType == "interval") {
            actions = actions or PlaybackStateCompat.ACTION_SKIP_TO_NEXT
        }

        session.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, remainingMs, 1.0f)
                .build()
        )

        val current = intervals.getOrNull(currentIndex)
        val title = when (timerType) {
            "random"    -> "Random timer"
            "stopwatch" -> "Stopwatch"
            else        -> current?.name ?: "Timer"
        }
        session.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "Cria Timer")
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, current?.durationMs ?: 0L)
                .build()
        )
    }

    private fun speak(text: String) {
        if (!ttsReady || !voicePromptsEnabled || text.isBlank()) return
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "cria-tts")
    }


    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent == null) return START_STICKY

    // 0. HANDLE TIMER TYPE SWITCH
    // If a startSequence call is coming in for a *different* timer type while
    // another timer is currently running, emit a stop event for the previous
    // type so its JS screen can reset its local state.
    val incomingTimerType = intent.getStringExtra("timerType")
    val isStartIntent = intent.hasExtra("intervals") && intent.getBooleanExtra("start", false)
    if (isStartIntent && isRunning && incomingTimerType != null && incomingTimerType != timerType) {
        sendStoppedToJS()
        handler.removeCallbacks(tickRunnable)
        isRunning = false
        isPaused = false
        intervals = emptyList()
        currentIndex = 0
        remainingBeforePause = 0L
    }

    if (intent.hasExtra("timerType")) {
        timerType = intent.getStringExtra("timerType") ?: "interval"
    }

    if (intent.hasExtra("repeat")) {
        shouldLoop = intent.getBooleanExtra("repeat", false)
    }

    if (intent.hasExtra("voicePrompts")) {
        voicePromptsEnabled = intent.getBooleanExtra("voicePrompts", false)
    }

    if (intent.hasExtra("repeatCount")) {
        totalPasses = intent.getIntExtra("repeatCount", 1).coerceAtLeast(1)
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
        "ACTION_PAUSE" -> { pauseEngine(); return START_STICKY }
        "ACTION_RESUME" -> { resumeEngine(); return START_STICKY }
        "ACTION_STOP" -> { resetEngine(); sendStoppedToJS(); stopSelf(); return START_NOT_STICKY }
        "ACTION_SKIP" -> { skipToNext(); return START_STICKY }
        "ACTION_SKIP_FORWARD" -> { skipForward(10000.0); return START_STICKY }
        "ACTION_LAP" -> { recordLap(); return START_STICKY }
        "ACTION_STOP_ALARM" -> {
            stopAlarmInternal()
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

    if (intent.getBooleanExtra("lap", false)) {
        recordLap()
    }

    return START_STICKY
}

    private fun sendAlarmNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            val channel = NotificationChannel(
                "alarm_channel",
                "Alarm",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                setSound(
                    android.net.Uri.parse("android.resource://$packageName/${R.raw.bedside_alarm}"),
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                enableVibration(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setBypassDnd(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
            Log.d("AlarmNotif", "Channel created")
        }

        // Deep-link the user back into the screen that fired the alarm.
        val launchUri = when (timerType) {
            "random" -> android.net.Uri.parse("cria-timer://random")
            else -> android.net.Uri.parse("cria-timer://")
        }
        val launchIntent = Intent(Intent.ACTION_VIEW, launchUri).apply {
            setPackage(packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, IntervalActionReceiver::class.java).apply {
            action = "ACTION_STOP_ALARM"
        }
        val stopPending = PendingIntent.getBroadcast(
            this, 10, stopIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val deleteIntent = Intent(this, IntervalActionReceiver::class.java).apply {
            action = "ACTION_STOP_ALARM"
        }
        val deletePending = PendingIntent.getBroadcast(
            this, 11, deleteIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "alarm_channel")
            .setContentTitle("Time's up!")
            .setContentText("Your timer has finished.")
            .setSmallIcon(R.drawable.notification_icon_cria)
            .setContentIntent(contentPendingIntent)
            .setDeleteIntent(deletePending)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(R.drawable.stop_vector, "Stop", stopPending)
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(2, notification)
    }

    private var alarmPlayer: MediaPlayer? = null

    private fun playAlarmSound() {
        alarmPlayer = MediaPlayer().apply {
            setAudioAttributes(
                android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            setDataSource(
                applicationContext,
                android.net.Uri.parse("android.resource://$packageName/${R.raw.bedside_alarm}")
            )
            isLooping = true
            prepare()
            start()
        }
        isAlarmRinging = true
        sendAlarmStartedToJS()
    }

    /**
     * Stop the looping alarm sound, cancel the alarm notification,
     * and notify the JS side. Safe to call when the alarm isn't ringing.
     */
    internal fun stopAlarmInternal() {
        try {
            alarmPlayer?.stop()
        } catch (_: IllegalStateException) {
            // already stopped — ignore
        }
        alarmPlayer?.release()
        alarmPlayer = null
        getSystemService(NotificationManager::class.java).cancel(2)
        if (isAlarmRinging) {
            isAlarmRinging = false
            sendAlarmStoppedToJS()
        }
    }

    internal fun sendAlarmStartedToJS() {
        val ctx = reactContext ?: return
        val params = Arguments.createMap().apply {
            putString("timerType", timerType)
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AlarmStarted", params)
    }

    internal fun sendAlarmStoppedToJS() {
        val ctx = reactContext ?: return
        val params = Arguments.createMap().apply {
            putString("timerType", timerType)
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AlarmStopped", params)
    }



    internal fun pauseEngine() {
        if (intervals.isEmpty() || currentIndex !in intervals.indices) {
            Log.w("IntervalService", "pauseEngine called with no active sequence; ignoring")
            return
        }
        isPaused = true
        val now = System.currentTimeMillis()
        val current = intervals[currentIndex]
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed
        val displayMs = if (timerType == "stopwatch") elapsed else current.durationMs - elapsed
        updateNotification(displayMs)
        remainingBeforePause = current.durationMs - elapsed

        handler.removeCallbacks(tickRunnable)

        sendPausedToJS()
    }

    internal fun resumeEngine() {
        if (intervals.isEmpty() || currentIndex !in intervals.indices) {
            Log.w("IntervalService", "resumeEngine called with no active sequence; ignoring")
            return
        }
        isRunning = true
        isPaused = false
        sendResumedToJS()

        // Calculate start time based on the saved remaining time
        intervalStartTime = System.currentTimeMillis() -
            (intervals[currentIndex].durationMs - remainingBeforePause)

        // Reset this so it doesn't interfere with future skips
        remainingBeforePause = 0L

        handler.post(tickRunnable)
    }

    internal fun skipToNext() {
        if (intervals.isEmpty()) return

        // 1. Pass / loop bookkeeping. If we're skipping the last interval of
        //    the final pass, finish the sequence instead of wrapping around.
        val isLastInterval = currentIndex == intervals.size - 1
        if (isLastInterval) {
            if (!shouldLoop) {
                finishSequence()
                return
            }
            completedPasses++
            if (completedPasses >= totalPasses) {
                finishSequence()
                return
            }
        }

        // 2. Move to next index (wrap)
        currentIndex = (currentIndex + 1) % intervals.size

        val nextInterval = intervals[currentIndex]

        // 3. Fix the Pause Logic
        if (isPaused) {
            remainingBeforePause = nextInterval.durationMs
            sendPausedToJS()
        } else {
            // If running, simply reset the start anchor to "now"
            intervalStartTime = System.currentTimeMillis()
        }

        lastBeepSecond = -1L
        lastSpokenSecond = -1L

        // 4. Audio Feedback
        beep?.let { if (!it.isPlaying) it.start() }
        speak(nextInterval.name)

        // 5. Update UI Layers
        sendUpdateToJS(nextInterval.name, nextInterval.durationMs)
        updateNotification(nextInterval.durationMs)
    }

    internal fun skipForward(ms: Double) {
        if (intervals.isEmpty()) return
        if (timerType == "stopwatch") return

        val isLastInterval = currentIndex == intervals.size - 1

        if (isPaused) {
            val newRemaining = remainingBeforePause - ms.toLong()
            if (newRemaining <= 0) {
                if (!shouldLoop && isLastInterval) {
                    remainingBeforePause = 0L
                    sendStoppedToJS()
                    stopSelf()
                    return
                }
                currentIndex = (currentIndex + 1) % intervals.size
                val nextInterval = intervals[currentIndex]
                remainingBeforePause = nextInterval.durationMs
                sendUpdateToJS(nextInterval.name, remainingBeforePause)
                updateNotification(remainingBeforePause)
            } else {
                remainingBeforePause = newRemaining
                sendUpdateToJS(intervals[currentIndex].name, remainingBeforePause)
                updateNotification(remainingBeforePause)
            }
        } else {
            val remaining = intervals[currentIndex].durationMs - (System.currentTimeMillis() - intervalStartTime)
            if (remaining <= ms.toLong()) {
                if (!shouldLoop && isLastInterval) {
                    isRunning = false
                    handler.removeCallbacksAndMessages(null)
                    sendStoppedToJS()
                    if (timerType == "countdown" || timerType == "random") {
                        stopForeground(true)
                        sendAlarmNotification()
                        playAlarmSound()
                    } else {
                        handler.postDelayed({ stopSelf() }, 1000)
                    }
                    return
                }
                currentIndex = (currentIndex + 1) % intervals.size
                intervalStartTime = System.currentTimeMillis()
                val nextInterval = intervals[currentIndex]
                sendUpdateToJS(nextInterval.name, nextInterval.durationMs)
                updateNotification(nextInterval.durationMs)
            } else {
                intervalStartTime -= ms.toLong()
                val newRemaining = intervals[currentIndex].durationMs - (System.currentTimeMillis() - intervalStartTime)
                updateNotification(newRemaining)
            }
        }
    }




    internal fun startEngine() {
        // Silence any leftover alarm from a previous sequence before starting fresh
        stopAlarmInternal()

        isRunning = true
        isPaused = false
        remainingBeforePause = 0L
        currentIndex = 0
        completedPasses = 0
        lastBeepSecond = -1L
        lastSpokenSecond = -1L
        intervalStartTime = System.currentTimeMillis()
        handler.post(tickRunnable)
    }

    internal fun resetEngine() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        isPaused = false
        currentIndex = 0
        completedPasses = 0
        intervalStartTime = 0L
        remainingBeforePause = 0L
        intervals = emptyList()
    }

    /**
     * Wraps up a sequence — used by both the natural-end branch in tickRunnable
     * and by skipToNext when the user skips past the final pass.
     */
    private fun finishSequence() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        sendStoppedToJS()
        if (timerType == "countdown" || timerType == "random") {
            stopForeground(true)
            sendAlarmNotification()
            playAlarmSound()
        } else {
            handler.postDelayed({ stopSelf() }, 1000)
        }
    }


    internal fun sendUpdateToJS(intervalName: String, remainingMs: Long) {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("intervalName", intervalName)
            putDouble("remainingMs", remainingMs.toDouble())
            putString("timerType", timerType)
            putInt("totalPasses", totalPasses)
            putInt("currentPass", completedPasses + 1)
        }

        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalUpdate", params)
    }

    internal fun sendPausedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalPaused", params)
    }

    internal fun sendResumedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)
        }
        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalResumed", params)
    }

    internal fun sendStoppedToJS() {
        val ctx = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("timerType", timerType)
        }

        ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("IntervalStopped", params)
    }

    internal fun recordLap() {
        if (timerType != "stopwatch") return
        val elapsed = System.currentTimeMillis() - intervalStartTime

        val ctx = reactContext ?: return
        val params = Arguments.createMap().apply {
            putDouble("elapsedMs", elapsed.toDouble())
        }
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("StopwatchLap", params)
    }


    private var lastBeepSecond = -1L
    private var lastSpokenSecond = -1L

    private val tickRunnable = object : Runnable {
        override fun run() {

            if (!isRunning || intervals.isEmpty() || isPaused) return

            val now = System.currentTimeMillis()
            val current = intervals[currentIndex]
            val elapsed = now - intervalStartTime
            val remaining = current.durationMs - elapsed

            val currentSecond = Math.ceil(remaining.toDouble() / 1000.0).toLong()

            if (timerType == "stopwatch") {
                sendUpdateToJS("Stopwatch", elapsed)
                handler.postDelayed(this, 50)
                if (now - lastNotificationUpdateTime >= 1000) {
                    updateNotification(elapsed)
                    lastNotificationUpdateTime = now
                }
                return
            }

            // --- Voice prompts at 60s, 30s, 10s, and the 3-2-1 countdown ---
            // Only update lastSpokenSecond when speak actually has a chance
            // to fire (TTS ready + prompts enabled), otherwise an early
            // 60s mark would be silently consumed before TTS init completes.
            val spokenText: String? = when (currentSecond) {
                60L -> "sixty seconds remaining!"
                30L -> "thirty seconds remaining!"
                10L -> "ten seconds remaining!"
                3L  -> "three"
                2L  -> "two"
                1L  -> "one"
                else -> null
            }

            // Grace period after each interval starts — suppresses any
            // checkpoint that lands within ~1.5s of the start so we don't
            // talk over the just-announced interval name and don't say
            // "sixty seconds remaining" on a 60-second timer.
            val graceMs = 1500L
            val withinStartGrace = elapsed < graceMs

            if (spokenText != null
                && !withinStartGrace
                && currentSecond != lastSpokenSecond
                && ttsReady
                && voicePromptsEnabled
                && timerType != "random"
            ) {
                speak(spokenText)
                lastSpokenSecond = currentSecond
            }

            if (currentSecond in 1..3 && currentSecond != lastBeepSecond) {
                if (timerType == "interval") {
                    ping?.let { if (!it.isPlaying) it.start() }
                }

                lastBeepSecond = currentSecond
            }

            sendUpdateToJS(current.name, remaining)

            if (now - lastNotificationUpdateTime >= 1000) {
                updateNotification(remaining)
                lastNotificationUpdateTime = now
            }


            if (remaining <= 0) {
                if (timerType == "interval") {
                    beep?.let { if (!it.isPlaying) it.start() }
                }
                lastBeepSecond = -1L
                lastSpokenSecond = -1L

                val isLastInterval = currentIndex == intervals.size - 1
                if (isLastInterval) {
                    if (!shouldLoop) {
                        finishSequence()
                        return
                    }
                    completedPasses++
                    if (completedPasses >= totalPasses) {
                        finishSequence()
                        return
                    }
                }

                currentIndex = (currentIndex + 1) % intervals.size
                intervalStartTime = System.currentTimeMillis()
                speak(intervals[currentIndex].name + " time")
                updateNotification(intervals[currentIndex].durationMs)
            }

            handler.postDelayed(this, 50)
        }
    }

    private fun buildActionPendingIntent(requestCode: Int, action: String): PendingIntent {
        val intent = Intent(this, IntervalService::class.java).apply {
            this.action = action
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PendingIntent.getForegroundService(
                this, requestCode, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        } else {
            PendingIntent.getService(
                this, requestCode, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        }
    }

    private fun startForegroundService() {
        if (timerType == "stopwatch") {
            val notification = buildNotification(false, 0L)
            startForeground(1, notification)
            return
        }

        val current = intervals[currentIndex]
        val now = System.currentTimeMillis()
        val elapsed = now - intervalStartTime
        val remaining = current.durationMs - elapsed
        val notification = buildNotification(false, remaining)
        startForeground(1, notification)
    }


    private fun buildNotification(isPaused: Boolean, remainingMs: Long): Notification {
        val channelId = "interval_channel"

        val pausePending = buildActionPendingIntent(0, "ACTION_PAUSE")
        val resumePending = buildActionPendingIntent(1, "ACTION_RESUME")
        val stopPending = buildActionPendingIntent(2, "ACTION_STOP")
        val skipPending = if (timerType == "interval") {
            buildActionPendingIntent(3, "ACTION_SKIP")
        } else {
            buildActionPendingIntent(4, "ACTION_SKIP_FORWARD")
        }
        val lapPending = buildActionPendingIntent(5, "ACTION_LAP")
        val contentPendingIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val intervalName = when (timerType) {
            "random" -> "Random"
            "stopwatch" -> "Stopwatch"
            else -> if (intervals.isNotEmpty()) intervals[currentIndex].name else "Timer"
        }

        val thirdButtonIcon = when (timerType) {
            "random" -> R.drawable.fast_forward_vector
            "stopwatch" -> R.drawable.laps_vector
            "interval" -> R.drawable.skip_next_vector
            "countdown" -> R.drawable.fast_forward_vector
            else -> R.drawable.skip_next_vector
        }

        val thirdButtonLabel = when (timerType) {
            "stopwatch" -> "Lap"
            else -> "Skip"
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.notification_icon_cria)
            .setContentIntent(contentPendingIntent)
            .setColor(android.graphics.Color.parseColor("#16191d"))
            .setColorized(true)
            .setOngoing(true)
            .setShowWhen(false)
            .setOnlyAlertOnce(true)
            // CATEGORY_STOPWATCH is the strongest hint to the OS that this is a
            // running timer — Samsung's Now Bar and Android's ongoing-activity
            // row use it to decide whether to promote the notification into a
            // status-bar pill. Random keeps the generic CATEGORY_SERVICE since
            // showing a "stopwatch" pill for a hidden-duration timer would
            // give the game away.
            .setCategory(
                if (timerType == "random")
                    NotificationCompat.CATEGORY_SERVICE
                else
                    NotificationCompat.CATEGORY_STOPWATCH
            )

        if (isPaused) {
            builder.setContentTitle(if (timerType == "random") "Random timer" else formatTime(remainingMs))
            builder.setContentText("$intervalName • Paused")
            builder.addAction(R.drawable.play_vector, "Resume", resumePending)   // Action 0
        } else {
            builder.setContentTitle(if (timerType == "random") "Random timer" else formatTime(remainingMs))
            builder.setContentText("$intervalName • Running")
            builder.addAction(R.drawable.pause_vector, "Pause", pausePending)    // Action 0
        }

        builder.addAction(R.drawable.stop_vector, "Stop", stopPending)           // Action 1
        builder.addAction(
            thirdButtonIcon,
            thirdButtonLabel,
            if (timerType == "stopwatch") lapPending else skipPending,
        )

        // MediaStyle here gives us the compact-view button layout: 2 buttons
        // (actions 0 and 2 — Play/Pause + Skip/Lap) in the collapsed view,
        // all 3 in the expanded view, all with our own icons.
        //
        // We deliberately do NOT call .setMediaSession(token) — that link is
        // what promotes the notification into Android 13+'s dedicated Media
        // Player card in Quick Settings, which is the "media-y" look we don't
        // want for a timer. The MediaSession (created in onCreate) is still
        // active independently and still drives paired watches, lock-screen,
        // and Bluetooth headphone controls.
        val style = androidx.media.app.NotificationCompat.MediaStyle()
            .setShowActionsInCompactView(0, 2) // Play/Pause + Skip/Lap, hide Stop

        builder.setStyle(style)

        return builder.build()
    }


    private fun updateNotification(remainingMs: Long) {
        updateMediaSession(remainingMs)
        val notification = buildNotification(isPaused, remainingMs)
        startForeground(1, notification)
    }



    private fun formatTime(ms: Long): String {
        val totalSeconds = ms / 1000
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60
        return if (hours > 0) {
            String.format("%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%02d:%02d", minutes, seconds)
        }
    }

    override fun onDestroy() {
        instance = null
        handler.removeCallbacksAndMessages(null)
        beep?.release()
        ping?.release()
        alarmPlayer?.release()
        tts?.stop()
        tts?.shutdown()
        tts = null
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
