import Foundation
import Security

enum KeychainError: Error {
  case status(OSStatus)
}

enum KeychainStore {
  private static let service = "com.iranti.vault"

  private static func baseQuery(account: String) -> [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]
  }

  static func read(account: String) -> Data? {
    var query = baseQuery(account: account)
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess else { return nil }
    return item as? Data
  }

  static func write(_ data: Data, account: String) throws {
    let attributes: [String: Any] = [
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
    ]
    let status = SecItemUpdate(baseQuery(account: account) as CFDictionary, attributes as CFDictionary)
    if status == errSecItemNotFound {
      let insert = baseQuery(account: account).merging(attributes) { _, new in new }
      let added = SecItemAdd(insert as CFDictionary, nil)
      guard added == errSecSuccess else { throw KeychainError.status(added) }
      return
    }
    guard status == errSecSuccess else { throw KeychainError.status(status) }
  }
}
