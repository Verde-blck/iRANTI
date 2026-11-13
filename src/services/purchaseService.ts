import { Platform } from 'react-native';
import {
  ErrorCode,
  PurchaseStateAndroid,
  endConnection,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
  getAvailablePurchases,
  getProducts,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { PREMIUM_SKU } from '../config/constants';
import { createStore } from '../core/store';
import { strings } from '../i18n/strings';
import { recordPremium } from './licenseEngine';
import { closePaywall } from './paywall';
import { resyncAll } from './reminderEngine';

export type PurchasePhase =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'purchasing'
  | 'restoring'
  | 'unavailable';

export interface PurchaseState {
  phase: PurchasePhase;
  price: string | null;
  error: string | null;
}

export const purchaseStore = createStore<PurchaseState>({
  phase: 'idle',
  price: null,
  error: null,
});

let connected = false;
let subscriptions: Array<{ remove: () => void }> = [];

function priceOf(product: Product): string | null {
  const shaped = product as Product & {
    localizedPrice?: string;
    oneTimePurchaseOfferDetails?: { formattedPrice?: string };
  };
  return shaped.localizedPrice ?? shaped.oneTimePurchaseOfferDetails?.formattedPrice ?? null;
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : strings.paywall.unavailable;
}

function transactionOf(purchase: Purchase): string {
  return purchase.transactionId ?? purchase.purchaseToken ?? 'unknown';
}

async function handlePurchase(purchase: Purchase): Promise<void> {
  if (purchase.productId !== PREMIUM_SKU) {
    return;
  }
  if (
    Platform.OS === 'android' &&
    purchase.purchaseStateAndroid !== PurchaseStateAndroid.PURCHASED
  ) {
    return;
  }
  await recordPremium(purchase.productId, transactionOf(purchase));
  await finishTransaction({ purchase, isConsumable: false }).catch(() => undefined);
  purchaseStore.set(state => ({ ...state, phase: 'ready', error: null }));
  closePaywall();
  await resyncAll();
}

function handleError(error: PurchaseError): void {
  if (error.code === ErrorCode.E_USER_CANCELLED) {
    purchaseStore.set(state => ({ ...state, phase: 'ready', error: null }));
    return;
  }
  purchaseStore.set(state => ({
    ...state,
    phase: 'ready',
    error: error.message || strings.paywall.unavailable,
  }));
}

async function syncOwned(closeOnFound: boolean): Promise<boolean> {
  const owned = await getAvailablePurchases();
  const match = owned.find(purchase => purchase.productId === PREMIUM_SKU);
  if (!match) {
    return false;
  }
  await recordPremium(match.productId, transactionOf(match));
  if (closeOnFound) {
    closePaywall();
  }
  await resyncAll();
  return true;
}

export async function initPurchases(): Promise<void> {
  if (connected) {
    return;
  }
  purchaseStore.set(state => ({ ...state, phase: 'connecting', error: null }));
  try {
    await initConnection();
    connected = true;
    if (Platform.OS === 'android') {
      await flushFailedPurchasesCachedAsPendingAndroid().catch(() => undefined);
    }
    subscriptions = [
      purchaseUpdatedListener(purchase => {
        handlePurchase(purchase).catch(error =>
          purchaseStore.set(state => ({ ...state, phase: 'ready', error: messageOf(error) })),
        );
      }),
      purchaseErrorListener(handleError),
    ];
    const products = await getProducts({ skus: [PREMIUM_SKU] });
    const product = products.find(item => item.productId === PREMIUM_SKU);
    purchaseStore.set({
      phase: product ? 'ready' : 'unavailable',
      price: product ? priceOf(product) : null,
      error: null,
    });
    if (Platform.OS === 'android') {
      await syncOwned(false).catch(() => false);
    }
  } catch (error) {
    purchaseStore.set({ phase: 'unavailable', price: null, error: messageOf(error) });
  }
}

export async function buyPremium(): Promise<void> {
  if (!connected) {
    await initPurchases();
  }
  if (purchaseStore.get().phase === 'unavailable') {
    return;
  }
  purchaseStore.set(state => ({ ...state, phase: 'purchasing', error: null }));
  try {
    await requestPurchase(
      Platform.OS === 'ios'
        ? { sku: PREMIUM_SKU, andDangerouslyFinishTransactionAutomaticallyIOS: false }
        : { skus: [PREMIUM_SKU] },
    );
  } catch (error) {
    handleError(error as PurchaseError);
  }
}

export async function restorePremium(): Promise<boolean> {
  if (!connected) {
    await initPurchases();
  }
  purchaseStore.set(state => ({ ...state, phase: 'restoring', error: null }));
  try {
    const found = await syncOwned(true);
    purchaseStore.set(state => ({
      ...state,
      phase: 'ready',
      error: found ? null : strings.paywall.restoreNone,
    }));
    return found;
  } catch (error) {
    purchaseStore.set(state => ({ ...state, phase: 'ready', error: messageOf(error) }));
    return false;
  }
}

export function teardownPurchases(): void {
  subscriptions.forEach(subscription => subscription.remove());
  subscriptions = [];
  if (connected) {
    connected = false;
    endConnection().catch(() => undefined);
  }
}
