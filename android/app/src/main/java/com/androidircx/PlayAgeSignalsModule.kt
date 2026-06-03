package com.androidircx

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import com.google.android.play.agesignals.model.AgeSignalsErrorCode
import com.google.android.play.agesignals.model.AgeSignalsVerificationStatus

/**
 * React Native bridge for Google Play Age Signals API.
 *
 * The API only returns age data in jurisdictions where Google Play is legally
 * required to provide it. A null status is a valid "not applicable / not shared"
 * response and must not crash or block app startup.
 */
class PlayAgeSignalsModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PlayAgeSignalsModule"

    @ReactMethod
    fun checkAgeSignals(promise: Promise) {
        try {
            val manager = AgeSignalsManagerFactory.create(reactApplicationContext)
            val request = AgeSignalsRequest.builder().build()

            manager.checkAgeSignals(request)
                .addOnSuccessListener { result ->
                    val map = Arguments.createMap()
                    val status = result.userStatus()

                    if (status != null) {
                        map.putInt("userStatusCode", status)
                        map.putString("userStatus", statusToString(status))
                    } else {
                        map.putNull("userStatusCode")
                        map.putNull("userStatus")
                    }

                    result.ageLower()?.let { map.putInt("ageLower", it) } ?: map.putNull("ageLower")
                    result.ageUpper()?.let { map.putInt("ageUpper", it) } ?: map.putNull("ageUpper")
                    result.installId()?.let { map.putString("installId", it) } ?: map.putNull("installId")
                    result.mostRecentApprovalDate()?.let { map.putDouble("mostRecentApprovalDate", it.time.toDouble()) }
                        ?: map.putNull("mostRecentApprovalDate")

                    promise.resolve(map)
                }
                .addOnFailureListener { error ->
                    val code = if (error is AgeSignalsException) {
                        error.errorCode
                    } else {
                        AgeSignalsErrorCode.INTERNAL_ERROR
                    }
                    val message = ageSignalsErrorMessage(code, error.message)
                    promise.reject(
                        "AGE_SIGNALS_ERROR_$code",
                        message,
                        error
                    )
                }
        } catch (error: Exception) {
            promise.reject(
                "AGE_SIGNALS_ERROR_${AgeSignalsErrorCode.INTERNAL_ERROR}",
                "Failed to request Play Age Signals: ${error.message ?: "unknown error"}",
                error
            )
        }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            AgeSignalsManagerFactory.create(reactApplicationContext)
            promise.resolve(true)
        } catch (_: Exception) {
            promise.resolve(false)
        }
    }

    private fun statusToString(status: Int): String {
        return when (status) {
            AgeSignalsVerificationStatus.VERIFIED -> "VERIFIED"
            AgeSignalsVerificationStatus.DECLARED -> "DECLARED"
            AgeSignalsVerificationStatus.SUPERVISED -> "SUPERVISED"
            AgeSignalsVerificationStatus.SUPERVISED_APPROVAL_PENDING -> "SUPERVISED_APPROVAL_PENDING"
            AgeSignalsVerificationStatus.SUPERVISED_APPROVAL_DENIED -> "SUPERVISED_APPROVAL_DENIED"
            AgeSignalsVerificationStatus.UNKNOWN -> "UNKNOWN"
            else -> "UNKNOWN_STATUS_$status"
        }
    }

    private fun ageSignalsErrorMessage(code: Int, fallback: String?): String {
        return when (code) {
            AgeSignalsErrorCode.API_NOT_AVAILABLE -> "Play Age Signals API is not available; Play Store may need an update."
            AgeSignalsErrorCode.PLAY_STORE_NOT_FOUND -> "Google Play Store is not installed or enabled."
            AgeSignalsErrorCode.NETWORK_ERROR -> "No network is available for Play Age Signals."
            AgeSignalsErrorCode.PLAY_SERVICES_NOT_FOUND -> "Google Play Services is missing or disabled."
            AgeSignalsErrorCode.CANNOT_BIND_TO_SERVICE -> "Could not bind to the Play Store Age Signals service."
            AgeSignalsErrorCode.PLAY_STORE_VERSION_OUTDATED -> "Google Play Store needs to be updated."
            AgeSignalsErrorCode.PLAY_SERVICES_VERSION_OUTDATED -> "Google Play Services needs to be updated."
            AgeSignalsErrorCode.CLIENT_TRANSIENT_ERROR -> "Temporary device error while checking Play Age Signals."
            AgeSignalsErrorCode.APP_NOT_OWNED -> "The app was not installed from Google Play."
            AgeSignalsErrorCode.SDK_VERSION_OUTDATED -> "The Play Age Signals SDK version is outdated."
            AgeSignalsErrorCode.INTERNAL_ERROR -> "Internal Play Age Signals error."
            else -> fallback ?: "Unknown Play Age Signals error code $code."
        }
    }
}
