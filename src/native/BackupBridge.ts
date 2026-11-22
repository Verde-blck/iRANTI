import { NativeModules } from 'react-native';

interface BackupModule {
  save(fileName: string, contents: string): Promise<boolean>;
  open(): Promise<string | null>;
}

function resolveModule(): BackupModule {
  const module = NativeModules.IrantiBackup as BackupModule | undefined;
  if (!module) {
    throw new Error('IrantiBackup native module is not linked');
  }
  return module;
}

export const BackupBridge = {
  save: (fileName: string, contents: string) => resolveModule().save(fileName, contents),
  open: () => resolveModule().open(),
};
