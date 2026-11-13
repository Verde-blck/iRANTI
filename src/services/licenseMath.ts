import {
  CLOCK_ROLLBACK_TOLERANCE_MS,
  TRIAL_WINDOW_MS,
  TRIAL_WINDOW_SECONDS,
} from '../config/constants';
import type { LicenseSnapshot } from '../types/license';

export interface LicenseInputs {
  now: number;
  firstLaunchAt: number;
  lastSeenAt: number;
  anchorValid: boolean;
  premiumActive: boolean;
}

export const BOOT_SNAPSHOT: LicenseSnapshot = {
  status: 'booting',
  firstLaunchAt: 0,
  trialEndsAt: 0,
  remainingMs: 0,
  isPremium: false,
  deepWakeAllowed: false,
  evaluatedAt: 0,
};

export function elapsedSeconds(at: number, firstLaunchAt: number): number {
  return (at - firstLaunchAt) / 1000;
}

export function computeLicense(input: LicenseInputs): LicenseSnapshot {
  const { now, firstLaunchAt, lastSeenAt, anchorValid, premiumActive } = input;
  const trialEndsAt = firstLaunchAt + TRIAL_WINDOW_MS;
  const base = { firstLaunchAt, trialEndsAt, evaluatedAt: now };
  if (premiumActive) {
    return { ...base, status: 'premium', remainingMs: 0, isPremium: true, deepWakeAllowed: true };
  }
  const rolledBack =
    lastSeenAt - now > CLOCK_ROLLBACK_TOLERANCE_MS ||
    firstLaunchAt - now > CLOCK_ROLLBACK_TOLERANCE_MS;
  if (!anchorValid || rolledBack) {
    return {
      ...base,
      status: 'tampered',
      remainingMs: 0,
      isPremium: false,
      deepWakeAllowed: false,
    };
  }
  if (elapsedSeconds(now, firstLaunchAt) > TRIAL_WINDOW_SECONDS) {
    return { ...base, status: 'expired', remainingMs: 0, isPremium: false, deepWakeAllowed: false };
  }
  return {
    ...base,
    status: 'trial',
    remainingMs: Math.max(0, trialEndsAt - now),
    isPremium: false,
    deepWakeAllowed: true,
  };
}

export function canDeepWakeAt(snapshot: LicenseSnapshot, fireAt: number): boolean {
  if (snapshot.isPremium) {
    return true;
  }
  if (snapshot.status !== 'trial') {
    return false;
  }
  return elapsedSeconds(fireAt, snapshot.firstLaunchAt) <= TRIAL_WINDOW_SECONDS;
}

export function wakeDeadline(snapshot: LicenseSnapshot): number {
  if (snapshot.isPremium) {
    return Number.MAX_SAFE_INTEGER;
  }
  return snapshot.status === 'trial' ? snapshot.trialEndsAt : 0;
}
