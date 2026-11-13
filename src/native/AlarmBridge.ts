import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { Priority } from '../types/task';

export interface NativeAlarm {
  id: string;
  title: string;
  body: string;
  fireAt: number;
  priority: Priority;
  deepWake: boolean;
}

export interface AlarmCapabilities {
  notifications: boolean;
  exactAlarms: boolean;
  fullScreen: boolean;
  criticalAlerts: boolean;
  batteryUnrestricted: boolean;
}

export type SettingsTarget = 'notifications' | 'exactAlarms' | 'fullScreen' | 'battery';

export type LaunchActionType = 'open' | 'paywall' | 'complete';

export interface LaunchAction {
  type: LaunchActionType;
  taskId: string | null;
}

interface AlarmModule {
  schedule(alarm: NativeAlarm): Promise<void>;
  cancel(taskId: string): Promise<void>;
  cancelAll(): Promise<void>;
  scheduledIds(): Promise<string[]>;
  capabilities(): Promise<AlarmCapabilities>;
  requestAuthorization(): Promise<AlarmCapabilities>;
  openSettings(target: SettingsTarget): Promise<void>;
  consumeLaunchAction(): Promise<LaunchAction | null>;
  dismiss(taskId: string): Promise<void>;
  snooze(taskId: string, minutes: number): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export const SNOOZE_PREFIX = 'snooze:';
const LAUNCH_EVENT = 'IrantiLaunchAction';

let emitter: NativeEventEmitter | null = null;

function resolveModule(): AlarmModule {
  const module = NativeModules.IrantiAlarm as AlarmModule | undefined;
  if (!module) {
    throw new Error('IrantiAlarm native module is not linked');
  }
  return module;
}

function resolveEmitter(): NativeEventEmitter {
  if (!emitter) {
    emitter = new NativeEventEmitter(resolveModule());
  }
  return emitter;
}

async function requestAuthorization(): Promise<AlarmCapabilities> {
  const module = resolveModule();
  if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  return module.requestAuthorization();
}

export const AlarmBridge = {
  schedule: (alarm: NativeAlarm) => resolveModule().schedule(alarm),
  cancel: (taskId: string) => resolveModule().cancel(taskId),
  cancelAll: () => resolveModule().cancelAll(),
  scheduledIds: () => resolveModule().scheduledIds(),
  capabilities: () => resolveModule().capabilities(),
  requestAuthorization,
  openSettings: (target: SettingsTarget) => resolveModule().openSettings(target),
  consumeLaunchAction: () => resolveModule().consumeLaunchAction(),
  dismiss: (taskId: string) => resolveModule().dismiss(taskId),
  snooze: (taskId: string, minutes: number) => resolveModule().snooze(taskId, minutes),
  onLaunchAction: (listener: () => void) => resolveEmitter().addListener(LAUNCH_EVENT, listener),
};
