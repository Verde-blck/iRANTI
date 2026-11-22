import {
  GoogleAuthProvider,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { GOOGLE_WEB_CLIENT_ID } from '../config/firebase';
import { createStore } from '../core/store';
import { GoogleSignInBridge } from '../native/GoogleSignInBridge';
import { firebaseAuth, firestore } from './firebase';
import { leaveAllSpaces } from './sharedActions';

export interface AccountUser {
  uid: string;
  name: string | null;
  email: string | null;
}

export interface AccountState {
  status: 'starting' | 'signedOut' | 'signedIn';
  user: AccountUser | null;
}

export type AccountErrorCode = 'no_account' | 'unsupported' | 'network' | 'failed';

export class AccountError extends Error {
  readonly code: AccountErrorCode;

  constructor(code: AccountErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AccountError';
    this.code = code;
  }
}

export const accountStore = createStore<AccountState>({ status: 'starting', user: null });

let started = false;

function toAccountError(error: unknown): AccountError {
  if (error instanceof AccountError) {
    return error;
  }
  const code = (error as { code?: unknown })?.code;
  if (code === 'E_NO_ACCOUNT') {
    return new AccountError('no_account');
  }
  if (code === 'E_UNSUPPORTED') {
    return new AccountError('unsupported');
  }
  if (code === 'auth/network-request-failed' || code === 'unavailable') {
    return new AccountError('network');
  }
  return new AccountError('failed', error instanceof Error ? error.message : undefined);
}

export function startAccount(): void {
  if (started) {
    return;
  }
  started = true;
  onAuthStateChanged(firebaseAuth(), user => {
    accountStore.set(
      user
        ? { status: 'signedIn', user: { uid: user.uid, name: user.displayName, email: user.email } }
        : { status: 'signedOut', user: null },
    );
  });
}

async function googleCredential() {
  const account = await GoogleSignInBridge.signIn(GOOGLE_WEB_CLIENT_ID);
  return account ? GoogleAuthProvider.credential(account.idToken) : null;
}

export async function signIn(): Promise<boolean> {
  try {
    const credential = await googleCredential();
    if (!credential) {
      return false;
    }
    const { user } = await signInWithCredential(firebaseAuth(), credential);
    await setDoc(
      doc(firestore(), 'users', user.uid),
      { name: user.displayName ?? null, email: user.email ?? null, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch (error) {
    throw toAccountError(error);
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth());
  } finally {
    await GoogleSignInBridge.signOut().catch(() => undefined);
  }
}

export async function deleteAccount(): Promise<boolean> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    return false;
  }
  try {
    const credential = await googleCredential();
    if (!credential) {
      return false;
    }
    await reauthenticateWithCredential(user, credential);
    await leaveAllSpaces();
    await deleteDoc(doc(firestore(), 'users', user.uid));
    await deleteUser(user);
    await GoogleSignInBridge.signOut().catch(() => undefined);
    return true;
  } catch (error) {
    throw toAccountError(error);
  }
}
