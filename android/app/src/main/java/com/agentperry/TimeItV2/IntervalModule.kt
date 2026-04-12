package com.agentperry.TimeItV2

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

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
    fun startSequence(intervalsJson: String, withRepeat: Boolean, timerType: String) {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("start", true)
        intent.putExtra("intervals", intervalsJson)
        intent.putExtra("repeat", withRepeat)
        intent.putExtra("timerType", timerType)
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

    @ReactMethod
    fun skipForward(ms: Double) {
        val context = reactApplicationContext
        val intent = Intent(context, IntervalService::class.java)
        intent.putExtra("skipForward", true)
        intent.putExtra("skipForwardMs", ms)
        context.startService(intent)
    }

    @ReactMethod
    fun getState(promise: Promise) {
        val map = Arguments.createMap()
        map.putBoolean("isRunning", IntervalService.isRunning)
        map.putBoolean("isPaused", IntervalService.isPaused)
        map.putString("timerType", IntervalService.timerType)
        map.putDouble("remainingMs", IntervalService.remainingBeforePause.toDouble())
        promise.resolve(map)
    }

}
