package com.iranti.alarm

import java.util.Calendar

object Recurrence {
  private const val HOUR_MS = 3_600_000L

  private fun earliestInstance(candidate: Calendar, hour: Int, minute: Int, after: Long): Long {
    val earlier = Calendar.getInstance().apply { timeInMillis = candidate.timeInMillis - HOUR_MS }
    val sameLocalTime =
      earlier.get(Calendar.HOUR_OF_DAY) == hour &&
        earlier.get(Calendar.MINUTE) == minute &&
        earlier.get(Calendar.DAY_OF_MONTH) == candidate.get(Calendar.DAY_OF_MONTH)
    return if (sameLocalTime && earlier.timeInMillis > after) earlier.timeInMillis else candidate.timeInMillis
  }

  fun next(kind: String, anchor: Long, after: Long): Long? {
    if (anchor > after) return anchor
    val anchorCal = Calendar.getInstance().apply { timeInMillis = anchor }
    val hour = anchorCal.get(Calendar.HOUR_OF_DAY)
    val minute = anchorCal.get(Calendar.MINUTE)
    val base = Calendar.getInstance().apply { timeInMillis = after }
    val year = base.get(Calendar.YEAR)
    val month = base.get(Calendar.MONTH)
    val day = base.get(Calendar.DAY_OF_MONTH)

    if (kind == "monthly") {
      val wanted = anchorCal.get(Calendar.DAY_OF_MONTH)
      for (offset in 0..13) {
        val candidate = Calendar.getInstance().apply {
          clear()
          set(year, month + offset, 1, hour, minute, 0)
        }
        val lastDay = candidate.getActualMaximum(Calendar.DAY_OF_MONTH)
        candidate.set(Calendar.DAY_OF_MONTH, minOf(wanted, lastDay))
        if (candidate.timeInMillis > after) return earliestInstance(candidate, hour, minute, after)
      }
      return null
    }

    for (offset in 0..8) {
      val candidate = Calendar.getInstance().apply {
        clear()
        set(year, month, day + offset, hour, minute, 0)
      }
      if (candidate.timeInMillis <= after) continue
      val weekday = candidate.get(Calendar.DAY_OF_WEEK)
      val matches =
        when (kind) {
          "daily" -> true
          "weekdays" -> weekday in Calendar.MONDAY..Calendar.FRIDAY
          "weekly" -> weekday == anchorCal.get(Calendar.DAY_OF_WEEK)
          else -> false
        }
      if (matches) return earliestInstance(candidate, hour, minute, after)
    }
    return null
  }
}
