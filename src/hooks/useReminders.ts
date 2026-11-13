import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import { AlarmBridge } from '../native/AlarmBridge';
import {
  cancelTaskReminder,
  readinessIssues,
  refreshCapabilities,
  reminderStore,
  requestReminderAccess,
  resolveIssue,
  resyncAll,
  scheduleTask,
} from '../services/reminderEngine';

export function useReminders() {
  const state = useStore(reminderStore, identity);
  const issues = useMemo(() => readinessIssues(state.capabilities), [state.capabilities]);

  return useMemo(
    () => ({
      capabilities: state.capabilities,
      syncing: state.syncing,
      lastSyncAt: state.lastSyncAt,
      issues,
      ready: state.capabilities !== null && issues.length === 0,
      requestAccess: requestReminderAccess,
      resolve: resolveIssue,
      refresh: refreshCapabilities,
      resync: resyncAll,
      schedule: scheduleTask,
      cancel: cancelTaskReminder,
      dismiss: AlarmBridge.dismiss,
      snooze: AlarmBridge.snooze,
    }),
    [state, issues],
  );
}
