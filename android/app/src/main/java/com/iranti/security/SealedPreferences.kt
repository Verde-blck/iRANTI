package com.iranti.security

import android.annotation.SuppressLint
import android.content.Context
import android.util.Base64

class SealedPreferences(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("iranti.vault.sealed", Context.MODE_PRIVATE)

  fun contains(key: String): Boolean = prefs.contains(key)

  fun read(key: String): String? {
    val encoded = prefs.getString(key, null) ?: return null
    val sealed = runCatching { Base64.decode(encoded, Base64.NO_WRAP) }.getOrNull() ?: return ""
    return KeystoreVault.open(sealed)?.toString(Charsets.UTF_8) ?: ""
  }

  @SuppressLint("ApplySharedPref")
  fun write(key: String, value: String) {
    val sealed = KeystoreVault.seal(value.toByteArray(Charsets.UTF_8))
    prefs.edit().putString(key, Base64.encodeToString(sealed, Base64.NO_WRAP)).commit()
  }
}
