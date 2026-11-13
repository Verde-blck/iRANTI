package com.iranti.alarm

import android.content.Context
import android.os.PowerManager

object WakeLocks {
  private const val TAG = "iranti:alarm"
  private var cpu: PowerManager.WakeLock? = null
  private var screen: PowerManager.WakeLock? = null

  @Suppress("DEPRECATION")
  @Synchronized
  fun acquire(context: Context) {
    val power = context.getSystemService(PowerManager::class.java) ?: return
    release()
    cpu =
      power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$TAG:cpu").apply {
        setReferenceCounted(false)
        acquire(AlarmContract.WAKE_TIMEOUT_MS)
      }
    screen =
      power.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP, "$TAG:screen").apply {
        setReferenceCounted(false)
        acquire(AlarmContract.WAKE_TIMEOUT_MS)
      }
  }

  @Synchronized
  fun release() {
    cpu?.takeIf { it.isHeld }?.release()
    screen?.takeIf { it.isHeld }?.release()
    cpu = null
    screen = null
  }
}
