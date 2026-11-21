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
  val repeat: String? = null,
  val repeatAnchor: Long = 0L,
) {
  fun toJson(): JSONObject {
    val json =
      JSONObject()
        .put("id", id)
        .put("taskId", taskId)
        .put("title", title)
        .put("body", body)
        .put("fireAt", fireAt)
        .put("priority", priority)
        .put("deepWake", deepWake)
        .put("repeatAnchor", repeatAnchor)
    if (repeat != null) json.put("repeat", repeat)
    return json
  }

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
        repeat = json.optString("repeat").takeIf { it.isNotEmpty() && it != "null" },
        repeatAnchor = json.optLong("repeatAnchor", 0L),
      )
  }
}
