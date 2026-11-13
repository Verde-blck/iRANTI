import Foundation
import React
import Security

@objc(IrantiSecureVault)
final class IrantiSecureVault: NSObject {
  private enum Account {
    static let storage = "iranti.mmkv.key.v1"
    static let anchor = "iranti.license.anchor.v1"
  }

  private enum VaultError: Error {
    case entropy
  }

  private let queue = DispatchQueue(label: "com.iranti.vault", qos: .userInitiated)

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private func perform(
    _ code: String,
    _ resolve: @escaping RCTPromiseResolveBlock,
    _ reject: @escaping RCTPromiseRejectBlock,
    _ work: @escaping () throws -> Any?
  ) {
    queue.async {
      do {
        resolve(try work())
      } catch {
        reject(code, error.localizedDescription, error)
      }
    }
  }

  private static func randomKey() throws -> String {
    var bytes = [UInt8](repeating: 0, count: 12)
    guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw VaultError.entropy }
    return Data(bytes).base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
  }

  @objc(getStorageKey:rejecter:)
  func getStorageKey(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_STORAGE_KEY", resolve, reject) {
      if let data = KeychainStore.read(account: Account.storage),
         let key = String(data: data, encoding: .utf8), key.count == 16 {
        return key
      }
      let key = try Self.randomKey()
      try KeychainStore.write(Data(key.utf8), account: Account.storage)
      return key
    }
  }

  @objc(sign:resolver:rejecter:)
  func sign(_ payload: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_SIGN", resolve, reject) {
      try DeviceSigner.sign(Data(payload.utf8)).base64EncodedString()
    }
  }

  @objc(verify:signature:resolver:rejecter:)
  func verify(_ payload: String, signature: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_VERIFY", resolve, reject) {
      guard let bytes = Data(base64Encoded: signature) else { return false }
      return DeviceSigner.verify(Data(payload.utf8), signature: bytes)
    }
  }

  @objc(readAnchor:rejecter:)
  func readAnchor(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_ANCHOR", resolve, reject) {
      guard let data = KeychainStore.read(account: Account.anchor) else { return nil }
      return String(data: data, encoding: .utf8) ?? ""
    }
  }

  @objc(writeAnchor:resolver:rejecter:)
  func writeAnchor(_ value: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_ANCHOR", resolve, reject) {
      try KeychainStore.write(Data(value.utf8), account: Account.anchor)
      return nil
    }
  }

  @objc(sealEntitlement:premium:resolver:rejecter:)
  func sealEntitlement(_ deadline: Double, premium: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_ENTITLEMENT", resolve, reject) {
      try EntitlementLedger.seal(deadline: deadline, premium: premium)
      return nil
    }
  }

  @objc(isHardwareBacked:rejecter:)
  func isHardwareBacked(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    perform("E_HARDWARE", resolve, reject) { DeviceSigner.isHardwareBacked }
  }
}
