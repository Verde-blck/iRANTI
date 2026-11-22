import { INBOX_LIST_ID } from '../config/constants';
import { BackupBridge } from '../native/BackupBridge';
import { StorageKeys } from '../storage/keys';
import { vault } from '../storage/vault';
import type { TaskList } from '../types/list';
import type { Task } from '../types/task';
import {
  type BackupError,
  backupFileName,
  buildBackup,
  mergeTasks,
  parseBackup,
  planListMerge,
} from '../utils/backup';
import { importListRecords, listStore, sanitiseLists } from './listRepository';
import { resyncAll } from './reminderEngine';
import { importTaskRecords, sanitiseTasks, taskStore } from './taskRepository';

export interface RestorePreview {
  tasks: Task[];
  lists: TaskList[];
  exportedAt: number;
}

export type PickResult =
  | { status: 'cancelled' }
  | { status: 'invalid'; error: BackupError }
  | { status: 'ready'; preview: RestorePreview };

export function lastBackupAt(): number | null {
  return vault().getNumber(StorageKeys.lastBackupAt) ?? null;
}

export async function saveBackup(): Promise<boolean> {
  const now = Date.now();
  const saved = await BackupBridge.save(
    backupFileName(now),
    buildBackup(taskStore.get(), listStore.get(), now),
  );
  if (saved) {
    vault().set(StorageKeys.lastBackupAt, now);
  }
  return saved;
}

export async function pickBackup(): Promise<PickResult> {
  const text = await BackupBridge.open();
  if (text === null) {
    return { status: 'cancelled' };
  }
  const parsed = parseBackup(text);
  if (!parsed.ok) {
    return { status: 'invalid', error: parsed.error };
  }
  return {
    status: 'ready',
    preview: {
      tasks: sanitiseTasks(parsed.file.tasks),
      lists: sanitiseLists(parsed.file.lists),
      exportedAt: parsed.file.exportedAt,
    },
  };
}

export async function applyBackup(preview: RestorePreview): Promise<void> {
  const plan = planListMerge(listStore.get(), preview.lists);
  importListRecords(plan.lists);
  const known = new Set(listStore.get().map(list => list.id));
  importTaskRecords(mergeTasks(taskStore.get(), preview.tasks, plan.remap, known, INBOX_LIST_ID));
  await resyncAll();
}
