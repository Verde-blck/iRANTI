package com.iranti.security

import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.SecureRandom
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class IrantiSecureVaultModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private val sealed by lazy { SealedPreferences(reactContext) }
  private val entitlements by lazy { EntitlementStore(reactContext) }

  override fun getName(): String = NAME

  override fun invalidate() {
    executor.shutdown()
    super.invalidate()
  }

  private fun dispatch(promise: Promise, code: String, work: () -> Any?) {
    executor.execute {
      try {
        promise.resolve(work())
      } catch (error: Exception) {
        promise.reject(code, error.message, error)
      }
    }
  }

  @ReactMethod
  fun getStorageKey(promise: Promise) =
    dispatch(promise, "E_STORAGE_KEY") {
      sealed.read(KEY_STORAGE)?.takeIf { it.length == 16 } ?: generateStorageKey().also { sealed.write(KEY_STORAGE, it) }
    }

  @ReactMethod
  fun sign(payload: String, promise: Promise) =
    dispatch(promise, "E_SIGN") {
      Base64.encodeToString(KeystoreVault.sign(payload.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    }

  @ReactMethod
  fun verify(payload: String, signature: String, promise: Promise) =
    dispatch(promise, "E_VERIFY") {
      val bytes = runCatching { Base64.decode(signature, Base64.NO_WRAP) }.getOrNull()
      bytes != null && KeystoreVault.verify(payload.toByteArray(Charsets.UTF_8), bytes)
    }

  @ReactMethod
  fun readAnchor(promise: Promise) = dispatch(promise, "E_ANCHOR") { sealed.read(KEY_ANCHOR) }

  @ReactMethod
  fun writeAnchor(value: String, promise: Promise) =
    dispatch(promise, "E_ANCHOR") {
      sealed.write(KEY_ANCHOR, value)
      null
    }

  @ReactMethod
  fun sealEntitlement(deadline: Double, premium: Boolean, promise: Promise) =
    dispatch(promise, "E_ENTITLEMENT") {
      entitlements.seal(deadline.toLong(), premium)
      null
    }

  @ReactMethod
  fun isHardwareBacked(promise: Promise) = dispatch(promise, "E_HARDWARE") { KeystoreVault.isHardwareBacked() }

  private fun generateStorageKey(): String {
    val bytes = ByteArray(12).also { SecureRandom().nextBytes(it) }
    return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
  }

  companion object {
    const val NAME = "IrantiSecureVault"
    private const val KEY_STORAGE = "mmkv.key"
    private const val KEY_ANCHOR = "license.anchor"
  }
}
