import { Platform } from 'react-native';
import { IOS_PENDING_LIMIT } from '../config/constants';
import { createStore } from '../core/store';
import { strings } from '../i18n/strings';
import {
  AlarmBridge,
  SNOOZE_PREFIX,
  type AlarmCapabilities,
  type NativeAlarm,
} from '../native/AlarmBridge';
import type { DeliveryMode, Task } from '../types/task';
import { evaluateLicense } from './licenseEngine';
import { canDeepWakeAt } from './licenseMath';
import { openPaywall } from './paywall';
import { applyDeliveries, taskStore } from './taskRepository';

export type ReadinessIssue = keyof AlarmCapabilities;

export type ScheduleOrigin = 'configure' | 'sync';

interface ReminderState {
  capabilities: AlarmCapabilities | null;
  syncing: boolean;
  lastSyncAt: number | null;
}

type ArmedTask = Task & { remindAt: number };

export const reminderStore = createStore<ReminderState>({
  capabilities: null,
  syncing: false,
  lastSyncAt: null,
});

let resyncTask: Promise<void> | null = null;

function isArmable(task: Task, now: number): task is ArmedTask {
  return !task.completed && task.remindAt !== null && task.remindAt > now;
}

function toNative(task: ArmedTask, deepWake: boolean): NativeAlarm {
  return {
    id: task.id,
    title: task.title,
    body: task.notes || strings.alarm.fallbackBody[task.priority],
    fireAt: task.remindAt,
    priority: task.priority,
    deepWake,
  };
}

export function readinessIssues(capabilities: AlarmCapabilities | null): ReadinessIssue[] {
  if (!capabilities) {
    return [];
  }
  const order: ReadinessIssue[] =
    Platform.OS === 'ios'
      ? ['notifications', 'criticalAlerts']
      : ['notifications', 'exactAlarms', 'fullScreen', 'criticalAlerts', 'batteryUnrestricted'];
  return order.filter(issue => !capabilities[issue]);
}

export async function refreshCapabilities(): Promise<AlarmCapabilities> {
  const capabilities = await AlarmBridge.capabilities();
  reminderStore.set(state => ({ ...state, capabilities }));
  return capabilities;
}

export async function requestReminderAccess(): Promise<AlarmCapabilities> {
  const capabilities = await AlarmBridge.requestAuthorization();
  reminderStore.set(state => ({ ...state, capabilities }));
  return capabilities;
}

export async function resolveIssue(issue: ReadinessIssue): Promise<void> {
  if (issue === 'notifications' || issue === 'criticalAlerts') {
    const capabilities = await requestReminderAccess();
    if (!capabilities[issue]) {
      await AlarmBridge.openSettings('notifications');
    }
    return;
  }
  if (issue === 'exactAlarms') {
    await AlarmBridge.openSettings('exactAlarms');
    return;
  }
  if (issue === 'fullScreen') {
    await AlarmBridge.openSettings('fullScreen');
    return;
  }
  await AlarmBridge.openSettings('battery');
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await AlarmBridge.cancel(taskId);
  applyDeliveries(new Map([[taskId, null]]));
}

export async function scheduleTask(
  task: Task,
  origin: ScheduleOrigin,
): Promise<DeliveryMode | null> {
  if (!isArmable(task, Date.now())) {
    await cancelTaskReminder(task.id);
    return null;
  }
  if (origin === 'configure' && !reminderStore.get().capabilities?.notifications) {
    await requestReminderAccess().catch(() => undefined);
  }
  const license = await evaluateLicense();
  const deepWake = canDeepWakeAt(license, task.remindAt);
  await AlarmBridge.schedule(toNative(task, deepWake));
  const mode: DeliveryMode = deepWake ? 'deep' : 'standard';
  applyDeliveries(new Map([[task.id, mode]]));
  if (origin === 'configure' && !license.deepWakeAllowed) {
    openPaywall('reminder_configured');
  }
  return mode;
}

async function runResync(): Promise<void> {
  reminderStore.set(state => ({ ...state, syncing: true }));
  try {
    const now = Date.now();
    const license = await evaluateLicense();
    const tasks = taskStore.get();
    const armable = tasks
      .filter((task): task is ArmedTask => isArmable(task, now))
      .sort((a, b) => a.remindAt - b.remindAt);
    const window = Platform.OS === 'ios' ? armable.slice(0, IOS_PENDING_LIMIT) : armable;
    const keep = new Set(window.map(task => task.id));
    const scheduled = await AlarmBridge.scheduledIds();
    await Promise.all(
      scheduled
        .filter(id => !id.startsWith(SNOOZE_PREFIX) && !keep.has(id))
        .map(id => AlarmBridge.cancel(id)),
    );
    const deliveries = new Map<string, DeliveryMode | null>();
    for (const task of window) {
      const deepWake = canDeepWakeAt(license, task.remindAt);
      await AlarmBridge.schedule(toNative(task, deepWake));
      deliveries.set(task.id, deepWake ? 'deep' : 'standard');
    }
    tasks.forEach(task => {
      if (!isArmable(task, now) && task.delivery !== null) {
        deliveries.set(task.id, null);
      }
    });
    applyDeliveries(deliveries);
  } finally {
    reminderStore.set(state => ({ ...state, syncing: false, lastSyncAt: Date.now() }));
  }
}

export function resyncAll(): Promise<void> {
  if (!resyncTask) {
    resyncTask = runResync().finally(() => {
      resyncTask = null;
    });
  }
  return resyncTask;
}
