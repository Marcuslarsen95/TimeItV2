package com.agentperry.TimeItV2

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class IntervalActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, IntervalService::class.java)

        when (intent.action) {
            "ACTION_PAUSE" -> serviceIntent.putExtra("pause", true)
            "ACTION_RESUME" -> serviceIntent.putExtra("resume", true)
            "ACTION_STOP" -> serviceIntent.putExtra("stop", true)
            "ACTION_SKIP" -> serviceIntent.putExtra("skip", true)
            "ACTION_STOP_ALARM" -> {
                serviceIntent.action = "ACTION_STOP_ALARM"
                context.startService(serviceIntent)
                return  
            }
        }

        context.startService(serviceIntent)
    }
}
