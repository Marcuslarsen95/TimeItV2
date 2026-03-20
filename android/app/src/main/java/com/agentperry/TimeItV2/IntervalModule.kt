package com.agentperry.TimeItV2

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IntervalModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        IntervalService.reactContext = reactContext
    }

    override fun getName() = "IntervalServiceModule"

    @ReactMethod
    fun startService() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("start", true)
        context.startForegroundService(intent)
    }

    @ReactMethod
    fun startSequence(intervalsJson: String) {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("start", true)
        intent.putExtra("intervals", intervalsJson)
        context.startForegroundService(intent)
    }



    @ReactMethod
    fun pause() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("pause", true)
        context.startService(intent)
    }

    @ReactMethod
    fun resume() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("resume", true)
        context.startService(intent)
    }

    @ReactMethod
    fun stop() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("stop", true)
        context.startService(intent)
    }

    @ReactMethod
    fun toggle() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("toggle", true)
        context.startService(intent)
    }

    @ReactMethod
    fun skip() {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("skip", true)
        context.startService(intent)
    }

}
