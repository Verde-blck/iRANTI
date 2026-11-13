package com.iranti.alarm

import android.content.Intent

data class LaunchAction(val type: String, val taskId: String?)

object LaunchActionStore {
  private var pending: LaunchAction? = null
  private var listener: (() -> Unit)? = null

  fun capture(intent: Intent?) {
    val type = intent?.getStringExtra(AlarmContract.EXTRA_LAUNCH) ?: return
    val taskId = intent.getStringExtra(AlarmContract.EXTRA_TASK)
    intent.removeExtra(AlarmContract.EXTRA_LAUNCH)
    val notify =
      synchronized(this) {
        pending = LaunchAction(type, taskId)
        listener
      }
    notify?.invoke()
  }

  @Synchronized
  fun consume(): LaunchAction? = pending.also { pending = null }

  @Synchronized
  fun attach(callback: () -> Unit) {
    listener = callback
  }

  @Synchronized
  fun detach() {
    listener = null
  }
}
