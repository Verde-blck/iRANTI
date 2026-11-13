package com.iranti.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val taskId = intent.getStringExtra(AlarmContract.EXTRA_TASK) ?: return
    val controller = AlarmController(context)
    when (intent.action) {
      AlarmContract.ACTION_SNOOZE -> controller.snooze(taskId, AlarmContract.SNOOZE_MINUTES)
      AlarmContract.ACTION_DISMISS -> controller.dismiss(taskId)
    }
  }
}
