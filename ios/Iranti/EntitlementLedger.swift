import Foundation

enum EntitlementLedger {
  private static let payloadAccount = "iranti.entitlement.payload.v1"
  private static let signatureAccount = "iranti.entitlement.signature.v1"
  private static let lastSeenAccount = "iranti.entitlement.lastSeen.v1"
  private static let rollbackToleranceMs: Int64 = 5 * 60 * 1000

  static func seal(deadline: Double, premium: Bool) throws {
    let payload = Data("v1|\(Int64(deadline))|\(premium)".utf8)
    let signature = try DeviceSigner.sign(payload)
    try KeychainStore.write(payload, account: payloadAccount)
    try KeychainStore.write(signature, account: signatureAccount)
  }

  static func allowsDeepWake(at date: Date) -> Bool {
    guard
      let payload = KeychainStore.read(account: payloadAccount),
      let signature = KeychainStore.read(account: signatureAccount),
      DeviceSigner.verify(payload, signature: signature),
      let text = String(data: payload, encoding: .utf8)
    else { return false }
    let parts = text.split(separator: "|").map(String.init)
    guard parts.count == 3, parts[0] == "v1", let deadline = Int64(parts[1]) else { return false }
    if parts[2] == "true" { return true }
    let now = Int64(Date().timeIntervalSince1970 * 1000)
    let lastSeen = KeychainStore.read(account: lastSeenAccount)
      .flatMap { String(data: $0, encoding: .utf8) }
      .flatMap { Int64($0) } ?? 0
    if lastSeen - now > rollbackToleranceMs { return false }
    if now > lastSeen { try? KeychainStore.write(Data(String(now).utf8), account: lastSeenAccount) }
    return Int64(date.timeIntervalSince1970 * 1000) <= deadline
  }
}
