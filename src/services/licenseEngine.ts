import { MAX_TIMER_MS, PREMIUM_SKU } from '../config/constants';
import { createStore } from '../core/store';
import { SecureVault } from '../native/SecureVault';
import { StorageKeys } from '../storage/keys';
import { vault } from '../storage/vault';
import type { AnchorRecord, LicenseSnapshot, PremiumRecord } from '../types/license';
import { createId } from '../utils/id';
import { parseJson } from '../utils/json';
import { BOOT_SNAPSHOT, computeLicense, wakeDeadline } from './licenseMath';

interface Sealed {
  payload: string;
  signature: string;
}

interface AnchorState {
  record: AnchorRecord;
  valid: boolean;
}

const INVALID_ANCHOR: AnchorRecord = { v: 1, installId: 'invalid', firstLaunchAt: 0 };

export const licenseStore = createStore<LicenseSnapshot>(BOOT_SNAPSHOT);

let anchorTask: Promise<AnchorState> | null = null;
let premiumCache: boolean | null = null;
let sealedEntitlement: string | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

function parseSealed(raw: string): Sealed | null {
  const value = parseJson<Partial<Sealed>>(raw);
  if (!value || typeof value.payload !== 'string' || typeof value.signature !== 'string') {
    return null;
  }
  return { payload: value.payload, signature: value.signature };
}

async function seal(value: object): Promise<string> {
  const payload = JSON.stringify(value);
  const signature = await SecureVault.sign(payload);
  return JSON.stringify({ payload, signature });
}

async function createAnchor(): Promise<AnchorState> {
  const record: AnchorRecord = { v: 1, installId: createId(), firstLaunchAt: Date.now() };
  await SecureVault.writeAnchor(await seal(record));
  return { record, valid: true };
}

async function readAnchor(): Promise<AnchorState> {
  const raw = await SecureVault.readAnchor();
  if (raw === null || raw === undefined) {
    return createAnchor();
  }
  const sealed = parseSealed(raw);
  const record = sealed ? parseJson<AnchorRecord>(sealed.payload) : null;
  if (!sealed || !record || record.v !== 1 || typeof record.firstLaunchAt !== 'number') {
    return { record: INVALID_ANCHOR, valid: false };
  }
  return { record, valid: await SecureVault.verify(sealed.payload, sealed.signature) };
}

function loadAnchor(): Promise<AnchorState> {
  if (!anchorTask) {
    anchorTask = readAnchor().catch(error => {
      anchorTask = null;
      throw error;
    });
  }
  return anchorTask;
}

async function loadPremium(): Promise<boolean> {
  if (premiumCache !== null) {
    return premiumCache;
  }
  const raw = vault().getString(StorageKeys.premium);
  const sealed = raw ? parseSealed(raw) : null;
  if (!sealed) {
    premiumCache = false;
    return false;
  }
  const valid = await SecureVault.verify(sealed.payload, sealed.signature);
  const record = valid ? parseJson<PremiumRecord>(sealed.payload) : null;
  premiumCache = Boolean(
    record && record.v === 1 && record.active && record.productId === PREMIUM_SKU,
  );
  return premiumCache;
}

async function syncEntitlement(snapshot: LicenseSnapshot): Promise<void> {
  const deadline = wakeDeadline(snapshot);
  const key = `${deadline}|${snapshot.isPremium}`;
  if (key === sealedEntitlement) {
    return;
  }
  await SecureVault.sealEntitlement(deadline, snapshot.isPremium);
  sealedEntitlement = key;
}

function armExpiry(snapshot: LicenseSnapshot): void {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
  }
  expiryTimer = null;
  if (snapshot.status !== 'trial') {
    return;
  }
  expiryTimer = setTimeout(() => {
    evaluateLicense().catch(() => undefined);
  }, Math.min(snapshot.remainingMs + 1000, MAX_TIMER_MS));
}

export async function evaluateLicense(): Promise<LicenseSnapshot> {
  const [anchor, premiumActive] = await Promise.all([loadAnchor(), loadPremium()]);
  const store = vault();
  const now = Date.now();
  const lastSeenAt = store.getNumber(StorageKeys.lastSeenAt) ?? 0;
  const snapshot = computeLicense({
    now,
    firstLaunchAt: anchor.record.firstLaunchAt,
    lastSeenAt,
    anchorValid: anchor.valid,
    premiumActive,
  });
  if (now > lastSeenAt) {
    store.set(StorageKeys.lastSeenAt, now);
  }
  await syncEntitlement(snapshot);
  licenseStore.set(snapshot);
  armExpiry(snapshot);
  return snapshot;
}

export async function recordPremium(
  productId: string,
  transactionId: string,
): Promise<LicenseSnapshot> {
  const record: PremiumRecord = {
    v: 1,
    active: true,
    productId,
    transactionId,
    verifiedAt: Date.now(),
  };
  vault().set(StorageKeys.premium, await seal(record));
  premiumCache = productId === PREMIUM_SKU;
  return evaluateLicense();
}
