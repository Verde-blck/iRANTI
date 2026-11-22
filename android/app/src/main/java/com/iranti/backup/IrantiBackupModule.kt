package com.iranti.backup

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class IrantiBackupModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private class Pending(val requestCode: Int, val promise: Promise, val contents: String?)

  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private var pending: Pending? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    reactContext.removeActivityEventListener(this)
    executor.shutdown()
    super.invalidate()
  }

  @ReactMethod
  fun save(fileName: String, contents: String, promise: Promise) {
    val intent =
      Intent(Intent.ACTION_CREATE_DOCUMENT)
        .addCategory(Intent.CATEGORY_OPENABLE)
        .setType(MIME_JSON)
        .putExtra(Intent.EXTRA_TITLE, fileName)
    launch(intent, Pending(REQUEST_SAVE, promise, contents))
  }

  @ReactMethod
  fun open(promise: Promise) {
    val intent =
      Intent(Intent.ACTION_OPEN_DOCUMENT)
        .addCategory(Intent.CATEGORY_OPENABLE)
        .setType("*/*")
        .putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(MIME_JSON, "text/plain", "application/octet-stream"))
    launch(intent, Pending(REQUEST_OPEN, promise, null))
  }

  private fun launch(intent: Intent, request: Pending) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      request.promise.reject("E_NO_SCREEN", "The app is not in the foreground")
      return
    }
    if (pending != null) {
      request.promise.reject("E_BUSY", "A file screen is already open")
      return
    }
    pending = request
    try {
      activity.startActivityForResult(intent, request.requestCode)
    } catch (error: Exception) {
      pending = null
      request.promise.reject("E_PICKER", error.message, error)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    val request = pending ?: return
    if (requestCode != request.requestCode) return
    pending = null
    val uri = data?.data
    if (resultCode != Activity.RESULT_OK || uri == null) {
      if (request.requestCode == REQUEST_SAVE) request.promise.resolve(false) else request.promise.resolve(null)
      return
    }
    executor.execute {
      try {
        if (request.requestCode == REQUEST_SAVE) {
          write(uri, request.contents.orEmpty())
          request.promise.resolve(true)
        } else {
          request.promise.resolve(read(uri))
        }
      } catch (error: Exception) {
        request.promise.reject("E_FILE", error.message, error)
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
  }

  private fun write(uri: Uri, contents: String) {
    val stream = reactContext.contentResolver.openOutputStream(uri, "wt") ?: throw IOException("Could not open the file")
    stream.use { it.write(contents.toByteArray(Charsets.UTF_8)) }
  }

  private fun read(uri: Uri): String {
    val stream = reactContext.contentResolver.openInputStream(uri) ?: throw IOException("Could not open the file")
    stream.use { input ->
      val output = ByteArrayOutputStream()
      val buffer = ByteArray(16 * 1024)
      var total = 0
      while (true) {
        val count = input.read(buffer)
        if (count < 0) break
        total += count
        if (total > MAX_BYTES) throw IOException("The file is too large")
        output.write(buffer, 0, count)
      }
      return output.toString(Charsets.UTF_8.name())
    }
  }

  companion object {
    const val NAME = "IrantiBackup"
    private const val MIME_JSON = "application/json"
    private const val REQUEST_SAVE = 4701
    private const val REQUEST_OPEN = 4702
    private const val MAX_BYTES = 5_000_000
  }
}
