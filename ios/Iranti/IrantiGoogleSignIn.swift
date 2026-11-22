import Foundation
import React

@objc(IrantiGoogleSignIn)
final class IrantiGoogleSignIn: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(signIn:resolver:rejecter:)
  func signIn(_ webClientId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    reject("E_UNSUPPORTED", "Google sign-in is not available on iPhone yet", nil)
  }

  @objc(signOut:rejecter:)
  func signOut(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(nil)
  }
}
