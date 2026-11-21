package com.iranti.alarm

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build

class AlarmScheduler(context: Context) {
  private val appContext = context.applicationContext
  private val alarmManager = appContext.getSystemService(AlarmManager::class.java)
  private val store = RecordStore.scheduled(appContext)

  fun canScheduleExact(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

  fun schedule(record: AlarmRecord) {
    store.put(record.id, record)
    arm(record)
  }

  fun cancel(id: String) {
    alarmManager.cancel(fireIntent(id))
    store.remove(id)
  }

  fun consume(id: String): AlarmRecord? = store.get(id)?.also { store.remove(id) }

  fun records(): List<AlarmRecord> = store.all()

  fun restoreAll() {
    val now = System.currentTimeMillis()
    val horizon = now - AlarmContract.MISSED_GRACE_MS
    store.all().forEach { record ->
      when {
        record.fireAt >= horizon -> arm(record)
        isRepeating(record) -> scheduleNextOccurrence(record, now)
        else -> store.remove(record.id)
      }
    }
  }

  fun scheduleNextOccurrence(record: AlarmRecord, now: Long = System.currentTimeMillis()) {
    if (!isRepeating(record)) return
    val kind = record.repeat ?: return
    val next = Recurrence.next(kind, record.repeatAnchor, maxOf(now, record.fireAt)) ?: return
    schedule(record.copy(fireAt = next))
  }

  private fun isRepeating(record: AlarmRecord): Boolean =
    record.repeat != null && !record.id.startsWith(AlarmContract.SNOOZE_PREFIX)

  @SuppressLint("ScheduleExactAlarm", "MissingPermission")
  private fun arm(record: AlarmRecord) {
    val operation = fireIntent(record.id)
    try {
      if (canScheduleExact()) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, record.fireAt, operation)
      } else {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, record.fireAt, operation)
      }
    } catch (revoked: SecurityException) {
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, record.fireAt, operation)
    }
  }

  private fun fireIntent(id: String): PendingIntent {
    val intent =
      Intent(appContext, AlarmReceiver::class.java)
        .setAction(AlarmContract.ACTION_FIRE)
        .setData(Uri.parse("iranti://alarm/${Uri.encode(id)}"))
        .putExtra(AlarmContract.EXTRA_ID, id)
    return PendingIntent.getBroadcast(
      appContext,
      id.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}
