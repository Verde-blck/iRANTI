package com.iranti.alarm

import android.annotation.SuppressLint
import android.content.Context
import org.json.JSONObject

class RecordStore private constructor(context: Context, name: String) {
  private val prefs = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)

  @SuppressLint("ApplySharedPref")
  fun put(key: String, record: AlarmRecord) {
    prefs.edit().putString(key, record.toJson().toString()).commit()
  }

  fun get(key: String): AlarmRecord? = prefs.getString(key, null)?.let(::decode)

  @SuppressLint("ApplySharedPref")
  fun remove(key: String) {
    prefs.edit().remove(key).commit()
  }

  fun all(): List<AlarmRecord> = prefs.all.values.mapNotNull { value -> (value as? String)?.let(::decode) }

  fun isEmpty(): Boolean = prefs.all.isEmpty()

  private fun decode(raw: String): AlarmRecord? = runCatching { AlarmRecord.fromJson(JSONObject(raw)) }.getOrNull()

  companion object {
    fun scheduled(context: Context) = RecordStore(context, "iranti.alarms.scheduled")

    fun ringing(context: Context) = RecordStore(context, "iranti.alarms.ringing")
  }
}
