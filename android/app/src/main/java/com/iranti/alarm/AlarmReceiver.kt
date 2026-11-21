package com.iranti.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.iranti.security.EntitlementStore

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmContract.ACTION_FIRE) return
    val id = intent.getStringExtra(AlarmContract.EXTRA_ID) ?: return
    val appContext = context.applicationContext
    val scheduler = AlarmScheduler(appContext)
    val record = scheduler.consume(id) ?: return
    scheduler.scheduleNextOccurrence(record)
    val notifier = AlarmNotifier(appContext)
    if (EntitlementStore(appContext).allowsDeepWake(System.currentTimeMillis())) {
      WakeLocks.acquire(appContext)
      RecordStore.ringing(appContext).put(record.taskId, record)
      notifier.showDeep(record)
    } else {
      notifier.showGated(record)
    }
  }
}
