import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import { evaluateLicense, licenseStore } from '../services/licenseEngine';
import { canDeepWakeAt } from '../services/licenseMath';
import { openPaywall } from '../services/paywall';
import { buyPremium, purchaseStore, restorePremium } from '../services/purchaseService';

export function useLicense() {
  const license = useStore(licenseStore, identity);
  const purchase = useStore(purchaseStore, identity);

  return useMemo(
    () => ({
      license,
      status: license.status,
      isPremium: license.isPremium,
      deepWakeAllowed: license.deepWakeAllowed,
      remainingMs: license.remainingMs,
      trialEndsAt: license.trialEndsAt,
      purchase,
      buy: buyPremium,
      restore: restorePremium,
      refresh: evaluateLicense,
      canDeepWakeAt: (fireAt: number) => canDeepWakeAt(license, fireAt),
      showPaywall: () => openPaywall('manual'),
    }),
    [license, purchase],
  );
}
