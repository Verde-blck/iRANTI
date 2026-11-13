import Foundation
import UserNotifications

enum AlarmContent {
  static let alarmCategory = "IRANTI_ALARM"
  static let gatedCategory = "IRANTI_GATED"
  static let snoozePrefix = "snooze:"
  static let soundName = UNNotificationSoundName("iranti_alarm.wav")

  static func calendarTrigger(for date: Date) -> UNCalendarNotificationTrigger {
    let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    return UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
  }

  static func request(
    identifier: String,
    taskId: String,
    title: String,
    body: String,
    priority: String,
    deepWake: Bool,
    critical: Bool,
    trigger: UNNotificationTrigger
  ) -> UNNotificationRequest {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.threadIdentifier = "iranti.tasks"
    content.userInfo = ["taskId": taskId, "priority": priority, "deepWake": deepWake]
    if deepWake {
      content.categoryIdentifier = alarmCategory
      content.relevanceScore = 1.0
      if critical {
        content.sound = .criticalSoundNamed(soundName, withAudioVolume: 1.0)
        content.interruptionLevel = .critical
      } else {
        content.sound = UNNotificationSound(named: soundName)
        content.interruptionLevel = .timeSensitive
      }
    } else {
      content.categoryIdentifier = gatedCategory
      content.subtitle = NSLocalizedString(
        "iranti.gated.subtitle",
        value: "Deep alerts are paused. Tap to keep them on.",
        comment: ""
      )
      content.sound = .default
      content.interruptionLevel = .active
    }
    return UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
  }
}

final class IrantiNotificationCenter: NSObject, UNUserNotificationCenterDelegate {
  static let shared = IrantiNotificationCenter()
  static let launchActionPosted = Notification.Name("IrantiLaunchActionPosted")
  static let snoozeMinutes = 10

  private enum Action {
    static let snooze = "IRANTI_SNOOZE"
    static let complete = "IRANTI_COMPLETE"
    static let dismiss = "IRANTI_DISMISS"
    static let restore = "IRANTI_RESTORE"
  }

  private let lock = NSLock()
  private var pending: [String: Any]?

  func install() {
    let center = UNUserNotificationCenter.current()
    center.delegate = self
    let snooze = UNNotificationAction(identifier: Action.snooze, title: "Snooze \(Self.snoozeMinutes) min", options: [])
    let complete = UNNotificationAction(identifier: Action.complete, title: "Mark complete", options: [.foreground])
    let dismiss = UNNotificationAction(identifier: Action.dismiss, title: "Dismiss", options: [.destructive])
    let restore = UNNotificationAction(identifier: Action.restore, title: "Keep deep alerts on", options: [.foreground])
    center.setNotificationCategories([
      UNNotificationCategory(identifier: AlarmContent.alarmCategory, actions: [snooze, complete, dismiss], intentIdentifiers: [], options: []),
      UNNotificationCategory(identifier: AlarmContent.gatedCategory, actions: [restore], intentIdentifiers: [], options: []),
    ])
  }

  func consume() -> [String: Any]? {
    lock.lock()
    defer { lock.unlock() }
    let value = pending
    pending = nil
    return value
  }

  func snooze(content: UNNotificationContent, minutes: Int, completion: (() -> Void)? = nil) {
    guard let taskId = content.userInfo["taskId"] as? String else {
      completion?()
      return
    }
    let interval = TimeInterval(max(1, minutes) * 60)
    let deepWake = EntitlementLedger.allowsDeepWake(at: Date().addingTimeInterval(interval))
    let center = UNUserNotificationCenter.current()
    center.getNotificationSettings { settings in
      let request = AlarmContent.request(
        identifier: AlarmContent.snoozePrefix + taskId,
        taskId: taskId,
        title: content.title,
        body: content.body,
        priority: content.userInfo["priority"] as? String ?? "normal",
        deepWake: deepWake,
        critical: settings.criticalAlertSetting == .enabled,
        trigger: UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
      )
      center.add(request) { _ in completion?() }
    }
  }

  private func post(type: String, taskId: String?) {
    lock.lock()
    pending = ["type": type, "taskId": taskId.map { $0 as Any } ?? NSNull()]
    lock.unlock()
    DispatchQueue.main.async {
      NotificationCenter.default.post(name: Self.launchActionPosted, object: nil)
    }
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .list, .sound])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let content = response.notification.request.content
    let taskId = content.userInfo["taskId"] as? String
    switch response.actionIdentifier {
    case Action.snooze:
      snooze(content: content, minutes: Self.snoozeMinutes, completion: completionHandler)
      return
    case Action.complete:
      post(type: "complete", taskId: taskId)
    case Action.restore:
      post(type: "paywall", taskId: taskId)
    case UNNotificationDefaultActionIdentifier:
      post(type: content.categoryIdentifier == AlarmContent.gatedCategory ? "paywall" : "open", taskId: taskId)
    default:
      break
    }
    completionHandler()
  }
}
