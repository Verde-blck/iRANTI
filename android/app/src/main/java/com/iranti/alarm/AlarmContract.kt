package com.iranti.alarm

object AlarmContract {
  const val ACTION_FIRE = "com.iranti.alarm.FIRE"
  const val ACTION_DISMISS = "com.iranti.alarm.DISMISS"
  const val ACTION_SNOOZE = "com.iranti.alarm.SNOOZE"
  const val EXTRA_ID = "iranti.alarm.id"
  const val EXTRA_TASK = "iranti.alarm.task"
  const val EXTRA_LAUNCH = "iranti.launch"
  const val LAUNCH_PAYWALL = "paywall"
  const val LAUNCH_OPEN = "open"
  const val LAUNCH_COMPLETE = "complete"
  const val CHANNEL_DEEP = "iranti.deep.v1"
  const val CHANNEL_STANDARD = "iranti.standard.v1"
  const val SNOOZE_PREFIX = "snooze:"
  const val WAKE_TIMEOUT_MS = 60_000L
  const val SNOOZE_MINUTES = 10
  const val MISSED_GRACE_MS = 15 * 60_000L
}
