import { createStore } from '../core/store';

export type PaywallReason = 'reminder_configured' | 'reminder_executed' | 'manual';

export interface PaywallState {
  visible: boolean;
  reason: PaywallReason | null;
}

export const paywallStore = createStore<PaywallState>({ visible: false, reason: null });

export function openPaywall(reason: PaywallReason): void {
  paywallStore.set({ visible: true, reason });
}

export function closePaywall(): void {
  paywallStore.set({ visible: false, reason: null });
}
