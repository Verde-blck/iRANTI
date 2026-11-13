package com.iranti.security

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object KeystoreVault {
  private const val PROVIDER = "AndroidKeyStore"
  private const val SIGNING_ALIAS = "iranti.license.signing.v1"
  private const val SEALING_ALIAS = "iranti.vault.sealing.v1"
  private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"
  private const val CIPHER = "AES/GCM/NoPadding"
  private const val IV_BYTES = 12
  private const val TAG_BITS = 128

  private val keyStore: KeyStore by lazy { KeyStore.getInstance(PROVIDER).apply { load(null) } }

  @Synchronized
  private fun signingEntry(): KeyStore.PrivateKeyEntry {
    (keyStore.getEntry(SIGNING_ALIAS, null) as? KeyStore.PrivateKeyEntry)?.let { return it }
    val strongBox = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
    try {
      generateSigningKey(strongBox)
    } catch (unavailable: Exception) {
      if (!strongBox) throw unavailable
      generateSigningKey(false)
    }
    return keyStore.getEntry(SIGNING_ALIAS, null) as KeyStore.PrivateKeyEntry
  }

  private fun generateSigningKey(strongBox: Boolean) {
    val builder =
      KeyGenParameterSpec.Builder(SIGNING_ALIAS, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
        .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
        .setDigests(KeyProperties.DIGEST_SHA256)
    if (strongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) builder.setIsStrongBoxBacked(true)
    KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, PROVIDER).apply {
      initialize(builder.build())
      generateKeyPair()
    }
  }

  @Synchronized
  private fun sealingKey(): SecretKey {
    (keyStore.getKey(SEALING_ALIAS, null) as? SecretKey)?.let { return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, PROVIDER).run {
      init(
        KeyGenParameterSpec.Builder(SEALING_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
          .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
          .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
          .setKeySize(256)
          .build(),
      )
      generateKey()
    }
  }

  fun sign(data: ByteArray): ByteArray =
    Signature.getInstance(SIGNATURE_ALGORITHM).run {
      initSign(signingEntry().privateKey)
      update(data)
      sign()
    }

  fun verify(data: ByteArray, signature: ByteArray): Boolean =
    runCatching {
      Signature.getInstance(SIGNATURE_ALGORITHM).run {
        initVerify(signingEntry().certificate.publicKey)
        update(data)
        verify(signature)
      }
    }.getOrDefault(false)

  @Suppress("DEPRECATION")
  fun isHardwareBacked(): Boolean =
    runCatching {
      val key = signingEntry().privateKey
      val info = KeyFactory.getInstance(key.algorithm, PROVIDER).getKeySpec(key, KeyInfo::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        info.securityLevel != KeyProperties.SECURITY_LEVEL_SOFTWARE
      } else {
        info.isInsideSecureHardware
      }
    }.getOrDefault(false)

  fun seal(plain: ByteArray): ByteArray {
    val cipher = Cipher.getInstance(CIPHER).apply { init(Cipher.ENCRYPT_MODE, sealingKey()) }
    return cipher.iv + cipher.doFinal(plain)
  }

  fun open(sealed: ByteArray): ByteArray? =
    runCatching {
      require(sealed.size > IV_BYTES)
      val cipher =
        Cipher.getInstance(CIPHER).apply {
          init(Cipher.DECRYPT_MODE, sealingKey(), GCMParameterSpec(TAG_BITS, sealed.copyOfRange(0, IV_BYTES)))
        }
      cipher.doFinal(sealed.copyOfRange(IV_BYTES, sealed.size))
    }.getOrNull()
}
