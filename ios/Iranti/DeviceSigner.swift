import CryptoKit
import Foundation
import Security

enum DeviceSignerError: Error {
  case accessControl
}

enum DeviceSigner {
  private static let enclaveAccount = "iranti.signing.enclave.v1"
  private static let softwareAccount = "iranti.signing.software.v1"
  private static let publicAccount = "iranti.signing.public.v1"
  private static let lock = NSLock()
  private static var cached: SigningKey?

  private enum SigningKey {
    case enclave(SecureEnclave.P256.Signing.PrivateKey)
    case software(P256.Signing.PrivateKey)

    var publicKey: P256.Signing.PublicKey {
      switch self {
      case .enclave(let key): return key.publicKey
      case .software(let key): return key.publicKey
      }
    }

    func signature(for data: Data) throws -> P256.Signing.ECDSASignature {
      switch self {
      case .enclave(let key): return try key.signature(for: data)
      case .software(let key): return try key.signature(for: data)
      }
    }
  }

  static var isHardwareBacked: Bool {
    guard let key = try? signingKey() else { return false }
    if case .enclave = key { return true }
    return false
  }

  static func sign(_ data: Data) throws -> Data {
    try signingKey().signature(for: data).derRepresentation
  }

  static func verify(_ data: Data, signature: Data) -> Bool {
    guard
      let publicKey = try? verificationKey(),
      let parsed = try? P256.Signing.ECDSASignature(derRepresentation: signature)
    else { return false }
    return publicKey.isValidSignature(parsed, for: data)
  }

  private static func verificationKey() throws -> P256.Signing.PublicKey {
    if let raw = KeychainStore.read(account: publicAccount) {
      return try P256.Signing.PublicKey(rawRepresentation: raw)
    }
    return try signingKey().publicKey
  }

  private static func signingKey() throws -> SigningKey {
    lock.lock()
    defer { lock.unlock() }
    if let cached { return cached }
    let key = try loadOrCreate()
    if KeychainStore.read(account: publicAccount) == nil {
      try KeychainStore.write(key.publicKey.rawRepresentation, account: publicAccount)
    }
    cached = key
    return key
  }

  private static func loadOrCreate() throws -> SigningKey {
    if let data = KeychainStore.read(account: enclaveAccount),
       let key = try? SecureEnclave.P256.Signing.PrivateKey(dataRepresentation: data) {
      return .enclave(key)
    }
    if let data = KeychainStore.read(account: softwareAccount),
       let key = try? P256.Signing.PrivateKey(rawRepresentation: data) {
      return .software(key)
    }
    if SecureEnclave.isAvailable {
      var error: Unmanaged<CFError>?
      guard let access = SecAccessControlCreateWithFlags(
        nil,
        kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        .privateKeyUsage,
        &error
      ) else { throw DeviceSignerError.accessControl }
      let key = try SecureEnclave.P256.Signing.PrivateKey(accessControl: access)
      try KeychainStore.write(key.dataRepresentation, account: enclaveAccount)
      return .enclave(key)
    }
    let key = P256.Signing.PrivateKey()
    try KeychainStore.write(key.rawRepresentation, account: softwareAccount)
    return .software(key)
  }
}
