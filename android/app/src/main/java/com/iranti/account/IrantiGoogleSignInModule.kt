package com.iranti.account

import android.os.CancellationSignal
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class IrantiGoogleSignInModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  override fun invalidate() {
    executor.shutdown()
    super.invalidate()
  }

  @ReactMethod
  fun signIn(webClientId: String, promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("E_NO_SCREEN", "The app is not in the foreground")
      return
    }
    val option = GetSignInWithGoogleOption.Builder(webClientId).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    CredentialManager.create(activity).getCredentialAsync(
      activity,
      request,
      CancellationSignal(),
      executor,
      object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
        override fun onResult(result: GetCredentialResponse) {
          val credential = result.credential
          if (credential !is CustomCredential ||
            credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
          ) {
            promise.reject("E_CREDENTIAL", "Google did not return a sign-in token")
            return
          }
          try {
            val google = GoogleIdTokenCredential.createFrom(credential.data)
            val account =
              Arguments.createMap().apply {
                putString("idToken", google.idToken)
                putString("name", google.displayName)
                putString("email", google.id)
              }
            promise.resolve(account)
          } catch (error: Exception) {
            promise.reject("E_CREDENTIAL", error.message, error)
          }
        }

        override fun onError(e: GetCredentialException) {
          when (e) {
            is GetCredentialCancellationException -> promise.resolve(null)
            is NoCredentialException -> promise.reject("E_NO_ACCOUNT", "No Google account on this phone", e)
            else -> promise.reject("E_SIGN_IN", e.message ?: e.type, e)
          }
        }
      },
    )
  }

  @ReactMethod
  fun signOut(promise: Promise) {
    CredentialManager.create(reactContext).clearCredentialStateAsync(
      ClearCredentialStateRequest(),
      null,
      executor,
      object : CredentialManagerCallback<Void?, ClearCredentialException> {
        override fun onResult(result: Void?) {
          promise.resolve(null)
        }

        override fun onError(e: ClearCredentialException) {
          promise.resolve(null)
        }
      },
    )
  }

  companion object {
    const val NAME = "IrantiGoogleSignIn"
  }
}
