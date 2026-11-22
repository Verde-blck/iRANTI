import { NativeModules } from 'react-native';

export interface GoogleAccount {
  idToken: string;
  name: string | null;
  email: string | null;
}

interface GoogleSignInModule {
  signIn(webClientId: string): Promise<GoogleAccount | null>;
  signOut(): Promise<void>;
}

function resolveModule(): GoogleSignInModule {
  const module = NativeModules.IrantiGoogleSignIn as GoogleSignInModule | undefined;
  if (!module) {
    throw new Error('IrantiGoogleSignIn native module is not linked');
  }
  return module;
}

export const GoogleSignInBridge = {
  signIn: (webClientId: string) => resolveModule().signIn(webClientId),
  signOut: () => resolveModule().signOut(),
};
