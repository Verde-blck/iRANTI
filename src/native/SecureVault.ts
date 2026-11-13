import { NativeModules } from 'react-native';

interface SecureVaultModule {
  getStorageKey(): Promise<string>;
  sign(payload: string): Promise<string>;
  verify(payload: string, signature: string): Promise<boolean>;
  readAnchor(): Promise<string | null>;
  writeAnchor(value: string): Promise<void>;
  sealEntitlement(deadline: number, premium: boolean): Promise<void>;
  isHardwareBacked(): Promise<boolean>;
}

function resolveModule(): SecureVaultModule {
  const module = NativeModules.IrantiSecureVault as SecureVaultModule | undefined;
  if (!module) {
    throw new Error('IrantiSecureVault native module is not linked');
  }
  return module;
}

export const SecureVault: SecureVaultModule = {
  getStorageKey: () => resolveModule().getStorageKey(),
  sign: payload => resolveModule().sign(payload),
  verify: (payload, signature) => resolveModule().verify(payload, signature),
  readAnchor: () => resolveModule().readAnchor(),
  writeAnchor: value => resolveModule().writeAnchor(value),
  sealEntitlement: (deadline, premium) => resolveModule().sealEntitlement(deadline, premium),
  isHardwareBacked: () => resolveModule().isHardwareBacked(),
};
