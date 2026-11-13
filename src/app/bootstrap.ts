import { evaluateLicense } from '../services/licenseEngine';
import { initPurchases } from '../services/purchaseService';
import { refreshCapabilities, resyncAll } from '../services/reminderEngine';
import { ensureTasksHydrated } from '../services/taskRepository';
import { openVault } from '../storage/vault';

let core: Promise<void> | null = null;

export function ensureCore(): Promise<void> {
  if (!core) {
    core = (async () => {
      await openVault();
      ensureTasksHydrated();
      await evaluateLicense();
    })().catch(error => {
      core = null;
      throw error;
    });
  }
  return core;
}

export async function bootstrap(): Promise<void> {
  await ensureCore();
  await refreshCapabilities().catch(() => undefined);
  await resyncAll().catch(() => undefined);
  initPurchases().catch(() => undefined);
}
