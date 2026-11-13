import { useEffect } from 'react';
import { AppState } from 'react-native';
import { routeLaunchAction } from '../app/launch';
import { AlarmBridge } from '../native/AlarmBridge';
import { refreshCapabilities, resyncAll } from '../services/reminderEngine';

export function useAppLifecycle(ready: boolean): void {
  useEffect(() => {
    if (!ready) {
      return;
    }
    let disposed = false;

    const drainLaunchAction = async () => {
      const action = await AlarmBridge.consumeLaunchAction().catch(() => null);
      if (action && !disposed) {
        await routeLaunchAction(action).catch(() => undefined);
      }
    };

    drainLaunchAction();
    const launchSubscription = AlarmBridge.onLaunchAction(() => {
      drainLaunchAction();
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        return;
      }
      refreshCapabilities().catch(() => undefined);
      resyncAll().catch(() => undefined);
      drainLaunchAction();
    });

    return () => {
      disposed = true;
      launchSubscription.remove();
      appStateSubscription.remove();
    };
  }, [ready]);
}
