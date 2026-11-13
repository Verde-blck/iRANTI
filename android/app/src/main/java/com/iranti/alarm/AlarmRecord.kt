package com.iranti.alarm

import org.json.JSONObject

data class AlarmRecord(
  val id: String,
  val taskId: String,
  val title: String,
  val body: String,
  val fireAt: Long,
  val priority: String,
  val deepWake: Boolean,
) {
  fun toJson(): JSONObject =
    JSONObject()
      .put("id", id)
      .put("taskId", taskId)
      .put("title", title)
      .put("body", body)
      .put("fireAt", fireAt)
      .put("priority", priority)
      .put("deepWake", deepWake)

  companion object {
    fun fromJson(json: JSONObject): AlarmRecord =
      AlarmRecord(
        id = json.getString("id"),
        taskId = json.optString("taskId", json.getString("id")),
        title = json.optString("title"),
        body = json.optString("body"),
        fireAt = json.getLong("fireAt"),
        priority = json.optString("priority", "normal"),
        deepWake = json.optBoolean("deepWake", true),
      )
  }
}
