import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { type Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';
import { vault } from '../storage/vault';

let auth: Auth | null = null;
let db: Firestore | null = null;

const authStorage = {
  getItem: async (key: string) => vault().getString(`firebase.${key}`) ?? null,
  setItem: async (key: string, value: string) => {
    vault().set(`firebase.${key}`, value);
  },
  removeItem: async (key: string) => {
    vault().delete(`firebase.${key}`);
  },
};

export function firebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = initializeAuth(firebaseApp(), { persistence: getReactNativePersistence(authStorage) });
  }
  return auth;
}

export function firestore(): Firestore {
  if (!db) {
    db = initializeFirestore(firebaseApp(), { experimentalForceLongPolling: true });
  }
  return db;
}
