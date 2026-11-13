export type LicenseStatus = 'booting' | 'trial' | 'expired' | 'premium' | 'tampered';

export interface LicenseSnapshot {
  status: LicenseStatus;
  firstLaunchAt: number;
  trialEndsAt: number;
  remainingMs: number;
  isPremium: boolean;
  deepWakeAllowed: boolean;
  evaluatedAt: number;
}

export interface AnchorRecord {
  v: 1;
  installId: string;
  firstLaunchAt: number;
}

export interface PremiumRecord {
  v: 1;
  active: boolean;
  productId: string;
  transactionId: string;
  verifiedAt: number;
}
