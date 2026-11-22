import Foundation
import React
import UIKit
import UniformTypeIdentifiers

@objc(IrantiBackup)
final class IrantiBackup: NSObject, UIDocumentPickerDelegate {
  private enum Mode {
    case save
    case open
  }

  private var mode: Mode?
  private var pendingResolve: RCTPromiseResolveBlock?
  private var pendingReject: RCTPromiseRejectBlock?

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private func begin(_ mode: Mode, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) -> UIViewController? {
    guard self.mode == nil else {
      reject("E_BUSY", "A file screen is already open", nil)
      return nil
    }
    guard let presenter = RCTPresentedViewController() else {
      reject("E_NO_SCREEN", "The app is not in the foreground", nil)
      return nil
    }
    self.mode = mode
    pendingResolve = resolve
    pendingReject = reject
    return presenter
  }

  private func finish() -> (Mode?, RCTPromiseResolveBlock?, RCTPromiseRejectBlock?) {
    let result = (mode, pendingResolve, pendingReject)
    mode = nil
    pendingResolve = nil
    pendingReject = nil
    return result
  }

  @objc(save:contents:resolver:rejecter:)
  func save(_ fileName: String, contents: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
      do {
        try contents.write(to: url, atomically: true, encoding: .utf8)
      } catch {
        reject("E_FILE", error.localizedDescription, error)
        return
      }
      guard let presenter = self.begin(.save, resolve, reject) else { return }
      let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
      picker.delegate = self
      presenter.present(picker, animated: true)
    }
  }

  @objc(open:rejecter:)
  func open(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let presenter = self.begin(.open, resolve, reject) else { return }
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.json, .plainText, .data], asCopy: true)
      picker.delegate = self
      presenter.present(picker, animated: true)
    }
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    let (mode, resolve, reject) = finish()
    switch mode {
    case .save:
      resolve?(true)
    case .open:
      guard let url = urls.first else {
        resolve?(nil)
        return
      }
      do {
        resolve?(try String(contentsOf: url, encoding: .utf8))
      } catch {
        reject?("E_FILE", error.localizedDescription, error)
      }
    case nil:
      break
    }
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    let (mode, resolve, _) = finish()
    if mode == .save {
      resolve?(false)
    } else {
      resolve?(nil)
    }
  }
}
