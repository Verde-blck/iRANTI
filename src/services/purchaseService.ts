import {
  ErrorCode,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
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
  return product.displayPrice || null;
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : strings.paywall.unavailable;
}

function transactionOf(purchase: Purchase): string {
  const transactionId = 'transactionId' in purchase ? purchase.transactionId : null;
  return transactionId || purchase.purchaseToken || purchase.id;
}

function ownsPremium(purchase: Purchase): boolean {
  return purchase.productId === PREMIUM_SKU && purchase.purchaseState === 'purchased';
}

async function handlePurchase(purchase: Purchase): Promise<void> {
  if (!ownsPremium(purchase)) {
    return;
  }
  await recordPremium(purchase.productId, transactionOf(purchase));
  await finishTransaction({ purchase, isConsumable: false }).catch(() => undefined);
  purchaseStore.set(state => ({ ...state, phase: 'ready', error: null }));
  closePaywall();
  await resyncAll();
}

function handleError(error: PurchaseError): void {
  if (error.code === ErrorCode.UserCancelled) {
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
  const match = owned.find(ownsPremium);
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
    subscriptions = [
      purchaseUpdatedListener(purchase => {
        handlePurchase(purchase).catch(error =>
          purchaseStore.set(state => ({ ...state, phase: 'ready', error: messageOf(error) })),
        );
      }),
      purchaseErrorListener(handleError),
    ];
    const products = (await fetchProducts({ skus: [PREMIUM_SKU], type: 'in-app' })) ?? [];
    const product = (products as Product[]).find(item => item.id === PREMIUM_SKU);
    purchaseStore.set({
      phase: product ? 'ready' : 'unavailable',
      price: product ? priceOf(product) : null,
      error: null,
    });
    await syncOwned(false).catch(() => false);
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
    await requestPurchase({
      request: { apple: { sku: PREMIUM_SKU }, google: { skus: [PREMIUM_SKU] } },
      type: 'in-app',
    });
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
