package com.androidircx

import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenshotProtectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenshotProtectionModule"

    @ReactMethod
    fun setScreenshotProtectionEnabled(enabled: Boolean, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is not available")
            return
        }

        activity.runOnUiThread {
            try {
                if (enabled) {
                    activity.window.setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    )
                } else {
                    activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SCREENSHOT_PROTECTION_ERROR", e.message, e)
            }
        }
    }
}
