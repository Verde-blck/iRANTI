package com.iranti.alarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      QUICKBOOT_POWERON,
      AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED -> AlarmScheduler(context).restoreAll()
    }
  }

  private companion object {
    const val QUICKBOOT_POWERON = "android.intent.action.QUICKBOOT_POWERON"
  }
}
