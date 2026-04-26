package com.agentperry.criatimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class IntervalActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "ACTION_PAUSE" -> IntervalService.instance?.pauseEngine()
            "ACTION_RESUME" -> IntervalService.instance?.resumeEngine()
            "ACTION_STOP" -> {
                IntervalService.instance?.resetEngine()
                IntervalService.instance?.sendStoppedToJS()
                IntervalService.instance?.stopSelf()
            }
            "ACTION_SKIP" -> IntervalService.instance?.skipToNext()
            "ACTION_SKIP_FORWARD" -> IntervalService.instance?.skipForward(10000.0)
            "ACTION_LAP" -> IntervalService.instance?.recordLap()
            "ACTION_STOP_ALARM" -> {
                val serviceIntent = Intent(context, IntervalService::class.java).apply {
                    action = "ACTION_STOP_ALARM"
                }
                context.startService(serviceIntent)
            }
        }
    }
}