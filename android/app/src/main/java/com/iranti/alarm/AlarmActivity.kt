package com.iranti.alarm

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import java.lang.ref.WeakReference
import org.json.JSONObject

class AlarmActivity : ReactActivity() {

  override fun getMainComponentName(): String = COMPONENT

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
      override fun getLaunchOptions(): Bundle = launchOptions(this@AlarmActivity.intent)
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    applyLockScreenFlags()
    super.onCreate(null)
    active = WeakReference(this)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val previous = recordFrom(getIntent())?.taskId
    setIntent(intent)
    if (recordFrom(intent)?.taskId != previous) recreate()
  }

  override fun onDestroy() {
    if (active?.get() === this) active = null
    super.onDestroy()
  }

  @Suppress("DEPRECATION")
  private fun applyLockScreenFlags() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    window.addFlags(
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON,
    )
  }

  companion object {
    private const val COMPONENT = "IrantiAlarm"
    private const val EXTRA_RECORD = "iranti.alarm.record"

    @Volatile private var active: WeakReference<AlarmActivity>? = null

    fun intentFor(context: Context, record: AlarmRecord): Intent =
      Intent(context, AlarmActivity::class.java)
        .setData(Uri.parse("iranti://alarm-screen/${Uri.encode(record.taskId)}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION)
        .putExtra(EXTRA_RECORD, record.toJson().toString())

    fun finishFor(taskId: String) {
      val activity = active?.get() ?: return
      val current = recordFrom(activity.intent)?.taskId
      if (taskId.isEmpty() || current == null || current == taskId) {
        activity.runOnUiThread { activity.finishAndRemoveTask() }
      }
    }

    private fun recordFrom(intent: Intent?): AlarmRecord? =
      intent?.getStringExtra(EXTRA_RECORD)?.let { raw -> runCatching { AlarmRecord.fromJson(JSONObject(raw)) }.getOrNull() }

    private fun launchOptions(intent: Intent?): Bundle {
      val record = recordFrom(intent)
      return Bundle().apply {
        putString("taskId", record?.taskId)
        putString("title", record?.title)
        putString("body", record?.body)
        putString("priority", record?.priority)
        putDouble("fireAt", (record?.fireAt ?: 0L).toDouble())
      }
    }
  }
}
