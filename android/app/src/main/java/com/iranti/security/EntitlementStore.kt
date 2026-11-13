package com.iranti.security

import android.annotation.SuppressLint
import android.content.Context
import android.util.Base64

class EntitlementStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("iranti.entitlement", Context.MODE_PRIVATE)

  @SuppressLint("ApplySharedPref")
  fun seal(deadline: Long, premium: Boolean) {
    val payload = "$VERSION|$deadline|$premium"
    val signature = Base64.encodeToString(KeystoreVault.sign(payload.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    prefs.edit().putString(KEY_PAYLOAD, payload).putString(KEY_SIGNATURE, signature).commit()
  }

  @SuppressLint("ApplySharedPref")
  fun allowsDeepWake(now: Long): Boolean {
    val payload = prefs.getString(KEY_PAYLOAD, null) ?: return false
    val encoded = prefs.getString(KEY_SIGNATURE, null) ?: return false
    val signature = runCatching { Base64.decode(encoded, Base64.NO_WRAP) }.getOrNull() ?: return false
    if (!KeystoreVault.verify(payload.toByteArray(Charsets.UTF_8), signature)) return false
    val parts = payload.split('|')
    if (parts.size != 3 || parts[0] != VERSION) return false
    val deadline = parts[1].toLongOrNull() ?: return false
    val premium = parts[2].toBooleanStrictOrNull() ?: return false
    if (premium) return true
    val lastSeen = prefs.getLong(KEY_LAST_SEEN, 0L)
    if (lastSeen - now > ROLLBACK_TOLERANCE_MS) return false
    if (now > lastSeen) prefs.edit().putLong(KEY_LAST_SEEN, now).commit()
    return now <= deadline
  }

  private companion object {
    const val VERSION = "v1"
    const val KEY_PAYLOAD = "payload"
    const val KEY_SIGNATURE = "signature"
    const val KEY_LAST_SEEN = "lastSeen"
    const val ROLLBACK_TOLERANCE_MS = 5 * 60_000L
  }
}
