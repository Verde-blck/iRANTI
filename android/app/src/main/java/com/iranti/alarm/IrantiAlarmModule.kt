package com.iranti.alarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class IrantiAlarmModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val scheduler by lazy { AlarmScheduler(reactContext) }
  private val controller by lazy { AlarmController(reactContext) }
  private val notifier by lazy { AlarmNotifier(reactContext) }

  init {
    AlarmNotifier(reactContext).ensureChannels()
    LaunchActionStore.attach { emitLaunchAction() }
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    LaunchActionStore.detach()
    super.invalidate()
  }

  private fun emitLaunchAction() {
    if (!reactContext.hasActiveReactInstance()) return
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(EVENT_LAUNCH, null)
  }

  @ReactMethod
  fun schedule(payload: ReadableMap, promise: Promise) {
    try {
      val id = payload.getString("id").orEmpty()
      require(id.isNotBlank()) { "Alarm id is required" }
      val record =
        AlarmRecord(
          id = id,
          taskId = id,
          title = payload.getString("title").orEmpty(),
          body = payload.getString("body").orEmpty(),
          fireAt = payload.getDouble("fireAt").toLong(),
          priority = payload.getString("priority") ?: "normal",
          deepWake = payload.hasKey("deepWake") && payload.getBoolean("deepWake"),
        )
      scheduler.schedule(record)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_SCHEDULE", error.message, error)
    }
  }

  @ReactMethod
  fun cancel(taskId: String, promise: Promise) {
    controller.cancelTask(taskId)
    promise.resolve(null)
  }

  @ReactMethod
  fun cancelAll(promise: Promise) {
    controller.cancelEverything()
    promise.resolve(null)
  }

  @ReactMethod
  fun scheduledIds(promise: Promise) {
    val ids = Arguments.createArray()
    scheduler.records().forEach { ids.pushString(it.id) }
    promise.resolve(ids)
  }

  @ReactMethod
  fun capabilities(promise: Promise) {
    promise.resolve(capabilityMap())
  }

  @ReactMethod
  fun requestAuthorization(promise: Promise) {
    notifier.ensureChannels()
    promise.resolve(capabilityMap())
  }

  @ReactMethod
  fun openSettings(target: String, promise: Promise) {
    val intent = settingsIntent(target)
    try {
      launch(intent)
    } catch (unsupported: Exception) {
      runCatching { launch(appDetailsIntent()) }
    }
    promise.resolve(null)
  }

  @ReactMethod
  fun consumeLaunchAction(promise: Promise) {
    val action = LaunchActionStore.consume()
    if (action == null) {
      promise.resolve(null)
      return
    }
    promise.resolve(
      Arguments.createMap().apply {
        putString("type", action.type)
        if (action.taskId != null) putString("taskId", action.taskId) else putNull("taskId")
      },
    )
  }

  @ReactMethod
  fun dismiss(taskId: String, promise: Promise) {
    controller.dismiss(taskId)
    promise.resolve(null)
  }

  @ReactMethod
  fun snooze(taskId: String, minutes: Double, promise: Promise) {
    controller.snooze(taskId, minutes.toInt())
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Double) {
  }

  private fun capabilityMap(): WritableMap {
    val notifications = NotificationManagerCompat.from(reactContext).areNotificationsEnabled()
    val fullScreen =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        reactContext.getSystemService(NotificationManager::class.java)?.canUseFullScreenIntent() ?: false
      } else {
        true
      }
    val power = reactContext.getSystemService(PowerManager::class.java)
    return Arguments.createMap().apply {
      putBoolean("notifications", notifications)
      putBoolean("exactAlarms", scheduler.canScheduleExact())
      putBoolean("fullScreen", fullScreen)
      putBoolean("criticalAlerts", notifications && notifier.deepChannelAudible())
      putBoolean("batteryUnrestricted", power?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: true)
    }
  }

  private fun launch(intent: Intent) {
    val activity = reactContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      reactContext.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun packageUri(): Uri = Uri.parse("package:${reactContext.packageName}")

  private fun appDetailsIntent(): Intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri())

  private fun notificationSettingsIntent(): Intent =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName)
    } else {
      appDetailsIntent()
    }

  private fun settingsIntent(target: String): Intent =
    when (target) {
      "exactAlarms" ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri())
        } else {
          appDetailsIntent()
        }
      "fullScreen" ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri())
        } else {
          notificationSettingsIntent()
        }
      "battery" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
      else -> notificationSettingsIntent()
    }

  companion object {
    const val NAME = "IrantiAlarm"
    private const val EVENT_LAUNCH = "IrantiLaunchAction"
  }
}
