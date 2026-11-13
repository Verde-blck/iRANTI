package com.iranti.alarm

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.iranti.MainActivity
import com.iranti.R

class AlarmNotifier(context: Context) {
  private val appContext = context.applicationContext
  private val compat = NotificationManagerCompat.from(appContext)

  fun ensureChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = appContext.getSystemService(NotificationManager::class.java) ?: return
    val deep =
      NotificationChannel(
        AlarmContract.CHANNEL_DEEP,
        appContext.getString(R.string.iranti_channel_deep),
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = appContext.getString(R.string.iranti_channel_deep_description)
        setSound(alarmSound(), alarmAudio())
        enableVibration(true)
        vibrationPattern = VIBRATION
        enableLights(true)
        lightColor = ACCENT
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
    val standard =
      NotificationChannel(
        AlarmContract.CHANNEL_STANDARD,
        appContext.getString(R.string.iranti_channel_standard),
        NotificationManager.IMPORTANCE_DEFAULT,
      ).apply {
        description = appContext.getString(R.string.iranti_channel_standard_description)
        lockscreenVisibility = Notification.VISIBILITY_PRIVATE
      }
    manager.createNotificationChannels(listOf(deep, standard))
  }

  fun deepChannelAudible(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true
    val manager = appContext.getSystemService(NotificationManager::class.java) ?: return false
    val channel = manager.getNotificationChannel(AlarmContract.CHANNEL_DEEP) ?: return true
    return channel.importance >= NotificationManager.IMPORTANCE_HIGH
  }

  @SuppressLint("MissingPermission")
  fun showDeep(record: AlarmRecord) {
    ensureChannels()
    if (!compat.areNotificationsEnabled()) return
    val alarmScreen =
      PendingIntent.getActivity(appContext, requestCode(record.taskId, 1), AlarmActivity.intentFor(appContext, record), FLAGS)
    val notification =
      NotificationCompat.Builder(appContext, AlarmContract.CHANNEL_DEEP)
        .setSmallIcon(R.drawable.ic_stat_iranti)
        .setColor(ACCENT)
        .setContentTitle(record.title)
        .setContentText(record.body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(record.body))
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setWhen(record.fireAt)
        .setShowWhen(true)
        .setSound(alarmSound(), AudioManager.STREAM_ALARM)
        .setVibrate(VIBRATION)
        .setFullScreenIntent(alarmScreen, true)
        .setContentIntent(alarmScreen)
        .addAction(0, appContext.getString(R.string.iranti_action_snooze), actionIntent(AlarmContract.ACTION_SNOOZE, record.taskId, 3))
        .addAction(0, appContext.getString(R.string.iranti_action_dismiss), actionIntent(AlarmContract.ACTION_DISMISS, record.taskId, 4))
        .build()
    notification.flags = notification.flags or Notification.FLAG_INSISTENT
    compat.notify(notificationId(record.taskId), notification)
  }

  @SuppressLint("MissingPermission")
  fun showGated(record: AlarmRecord) {
    ensureChannels()
    if (!compat.areNotificationsEnabled()) return
    val paywall =
      PendingIntent.getActivity(
        appContext,
        requestCode(record.taskId, 2),
        launchIntent(appContext, AlarmContract.LAUNCH_PAYWALL, record.taskId),
        FLAGS,
      )
    val gatedNote = appContext.getString(R.string.iranti_gated_body)
    val notification =
      NotificationCompat.Builder(appContext, AlarmContract.CHANNEL_STANDARD)
        .setSmallIcon(R.drawable.ic_stat_iranti)
        .setColor(ACCENT)
        .setContentTitle(record.title)
        .setContentText(gatedNote)
        .setStyle(NotificationCompat.BigTextStyle().bigText("${record.body}\n$gatedNote"))
        .setCategory(NotificationCompat.CATEGORY_REMINDER)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setAutoCancel(true)
        .setWhen(record.fireAt)
        .setShowWhen(true)
        .setContentIntent(paywall)
        .build()
    compat.notify(notificationId(record.taskId), notification)
  }

  fun cancel(taskId: String) {
    compat.cancel(notificationId(taskId))
  }

  private fun actionIntent(action: String, taskId: String, slot: Int): PendingIntent {
    val intent =
      Intent(appContext, AlarmActionReceiver::class.java)
        .setAction(action)
        .setData(Uri.parse("iranti://action/$action/${Uri.encode(taskId)}"))
        .putExtra(AlarmContract.EXTRA_TASK, taskId)
    return PendingIntent.getBroadcast(appContext, requestCode(taskId, slot), intent, FLAGS)
  }

  private fun alarmSound(): Uri =
    Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${appContext.packageName}/${R.raw.iranti_alarm}")

  private fun alarmAudio(): AudioAttributes =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

  companion object {
    private const val FLAGS = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    private val ACCENT = Color.parseColor("#00FF66")
    private val VIBRATION = longArrayOf(0, 700, 300, 700, 300, 1400)

    fun notificationId(taskId: String): Int = taskId.hashCode()

    private fun requestCode(taskId: String, slot: Int): Int = 31 * taskId.hashCode() + slot

    fun launchIntent(context: Context, type: String, taskId: String?): Intent =
      Intent(context, MainActivity::class.java)
        .setAction(Intent.ACTION_VIEW)
        .setData(Uri.parse("iranti://launch/$type/${Uri.encode(taskId.orEmpty())}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        .putExtra(AlarmContract.EXTRA_LAUNCH, type)
        .putExtra(AlarmContract.EXTRA_TASK, taskId)
  }
}
