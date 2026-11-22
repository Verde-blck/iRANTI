package com.iranti

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.iranti.alarm.IrantiAlarmModule
import com.iranti.backup.IrantiBackupModule
import com.iranti.security.IrantiSecureVaultModule

class IrantiPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(IrantiAlarmModule(reactContext), IrantiSecureVaultModule(reactContext), IrantiBackupModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
