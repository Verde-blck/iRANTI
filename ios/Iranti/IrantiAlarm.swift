import Foundation
import React
import UIKit
import UserNotifications

@objc(IrantiAlarm)
final class IrantiAlarm: RCTEventEmitter {
  private static let launchEvent = "IrantiLaunchAction"
  private var hasListeners = false
  private var observer: NSObjectProtocol?

  override init() {
    super.init()
    observer = NotificationCenter.default.addObserver(
      forName: IrantiNotificationCenter.launchActionPosted,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.emitLaunchAction()
    }
  }

  deinit {
    if let observer { NotificationCenter.default.removeObserver(observer) }
  }

  override class func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! { [Self.launchEvent] }

  override func startObserving() { hasListeners = true }

  override func stopObserving() { hasListeners = false }

  private func emitLaunchAction() {
    guard hasListeners else { return }
    sendEvent(withName: Self.launchEvent, body: nil)
  }

  private static func describe(_ settings: UNNotificationSettings) -> [String: Bool] {
    let authorised = [UNAuthorizationStatus.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus)
    return [
      "notifications": authorised,
      "exactAlarms": true,
      "fullScreen": settings.lockScreenSetting != .disabled,
      "criticalAlerts": settings.criticalAlertSetting != .disabled,
      "batteryUnrestricted": true,
    ]
  }

  @objc(schedule:resolver:rejecter:)
  func schedule(_ payload: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard
      let id = payload["id"] as? String, !id.isEmpty,
      let fireAt = (payload["fireAt"] as? NSNumber)?.doubleValue
    else {
      reject("E_PAYLOAD", "Alarm payload is incomplete", nil)
      return
    }
    let title = payload["title"] as? String ?? ""
    let body = payload["body"] as? String ?? ""
    let priority = payload["priority"] as? String ?? "normal"
    let deepWake = (payload["deepWake"] as? Bool) ?? false
    let date = Date(timeIntervalSince1970: fireAt / 1000)
    let center = UNUserNotificationCenter.current()
    center.getNotificationSettings { settings in
      let request = AlarmContent.request(
        identifier: id,
        taskId: id,
        title: title,
        body: body,
        priority: priority,
        deepWake: deepWake,
        critical: settings.criticalAlertSetting == .enabled,
        trigger: AlarmContent.calendarTrigger(for: date)
      )
      center.add(request) { error in
        if let error {
          reject("E_SCHEDULE", error.localizedDescription, error)
        } else {
          resolve(nil)
        }
      }
    }
  }

  @objc(cancel:resolver:rejecter:)
  func cancel(_ taskId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let identifiers = [taskId, AlarmContent.snoozePrefix + taskId]
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: identifiers)
    center.removeDeliveredNotifications(withIdentifiers: identifiers)
    resolve(nil)
  }

  @objc(cancelAll:rejecter:)
  func cancelAll(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let center = UNUserNotificationCenter.current()
    center.removeAllPendingNotificationRequests()
    center.removeAllDeliveredNotifications()
    resolve(nil)
  }

  @objc(scheduledIds:rejecter:)
  func scheduledIds(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
      resolve(requests.map(\.identifier))
    }
  }

  @objc(capabilities:rejecter:)
  func capabilities(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getNotificationSettings { resolve(Self.describe($0)) }
  }

  @objc(requestAuthorization:rejecter:)
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .sound, .badge, .criticalAlert]) { _, error in
      if let error {
        reject("E_AUTHORISATION", error.localizedDescription, error)
        return
      }
      center.getNotificationSettings { resolve(Self.describe($0)) }
    }
  }

  @objc(openSettings:resolver:rejecter:)
  func openSettings(_ target: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let raw: String
      if #available(iOS 16.0, *) {
        raw = UIApplication.openNotificationSettingsURLString
      } else {
        raw = UIApplication.openSettingsURLString
      }
      guard let url = URL(string: raw) else {
        resolve(nil)
        return
      }
      UIApplication.shared.open(url) { _ in resolve(nil) }
    }
  }

  @objc(consumeLaunchAction:rejecter:)
  func consumeLaunchAction(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(IrantiNotificationCenter.shared.consume())
  }

  @objc(dismiss:resolver:rejecter:)
  func dismiss(_ taskId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [taskId, AlarmContent.snoozePrefix + taskId])
    resolve(nil)
  }

  @objc(snooze:minutes:resolver:rejecter:)
  func snooze(_ taskId: String, minutes: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let center = UNUserNotificationCenter.current()
    center.getDeliveredNotifications { delivered in
      guard let match = delivered.first(where: { ($0.request.content.userInfo["taskId"] as? String) == taskId }) else {
        resolve(nil)
        return
      }
      center.removeDeliveredNotifications(withIdentifiers: [match.request.identifier])
      IrantiNotificationCenter.shared.snooze(content: match.request.content, minutes: Int(minutes)) { resolve(nil) }
    }
  }
}
