import type { LaunchAction } from '../native/AlarmBridge';
import { licenseStore } from '../services/licenseEngine';
import { openPaywall } from '../services/paywall';
import { setTaskCompleted } from '../services/taskActions';

export async function routeLaunchAction(action: LaunchAction): Promise<void> {
  if (action.type === 'paywall') {
    if (!licenseStore.get().isPremium) {
      openPaywall('reminder_executed');
    }
    return;
  }
  if (action.type === 'complete' && action.taskId) {
    await setTaskCompleted(action.taskId, true);
  }
}
