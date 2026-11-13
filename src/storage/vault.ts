import { MMKV } from 'react-native-mmkv';
import { VAULT_ID } from '../config/constants';
import { SecureVault } from '../native/SecureVault';
import { parseJson } from '../utils/json';

let instance: MMKV | null = null;
let opening: Promise<MMKV> | null = null;

export function openVault(): Promise<MMKV> {
  if (instance) {
    return Promise.resolve(instance);
  }
  if (!opening) {
    opening = SecureVault.getStorageKey()
      .then(encryptionKey => {
        instance = new MMKV({ id: VAULT_ID, encryptionKey });
        return instance;
      })
      .catch(error => {
        opening = null;
        throw error;
      });
  }
  return opening;
}

export function vault(): MMKV {
  if (!instance) {
    throw new Error('Vault accessed before it was opened');
  }
  return instance;
}

export function readJson<T>(key: string): T | null {
  const raw = vault().getString(key);
  return raw ? parseJson<T>(raw) : null;
}

export function writeJson(key: string, value: unknown): void {
  vault().set(key, JSON.stringify(value));
}
