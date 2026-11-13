package com.iranti.alarm

import android.content.Context

class AlarmController(context: Context) {
  private val appContext = context.applicationContext
  private val scheduler = AlarmScheduler(appContext)
  private val ringing = RecordStore.ringing(appContext)
  private val notifier = AlarmNotifier(appContext)

  fun cancelTask(taskId: String) {
    scheduler.cancel(taskId)
    scheduler.cancel(AlarmContract.SNOOZE_PREFIX + taskId)
    silence(taskId)
  }

  fun cancelEverything() {
    scheduler.records().forEach { scheduler.cancel(it.id) }
    ringing.all().forEach { silence(it.taskId) }
  }

  fun dismiss(taskId: String) {
    silence(taskId)
  }

  fun snooze(taskId: String, minutes: Int) {
    val record = ringing.get(taskId)
    silence(taskId)
    if (record == null) return
    val delay = minutes.coerceIn(1, 120) * 60_000L
    scheduler.schedule(
      record.copy(id = AlarmContract.SNOOZE_PREFIX + taskId, fireAt = System.currentTimeMillis() + delay),
    )
  }

  private fun silence(taskId: String) {
    ringing.remove(taskId)
    notifier.cancel(taskId)
    if (ringing.isEmpty()) WakeLocks.release()
    AlarmActivity.finishFor(taskId)
  }
}
