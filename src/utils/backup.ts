import type { TaskList } from '../types/list';
import type { Task } from '../types/task';

export const BACKUP_APP = 'iRANTI';
export const BACKUP_FORMAT = 1;
export const BACKUP_MAX_CHARS = 5_000_000;

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: number;
  exportedAt: number;
  tasks: unknown[];
  lists: unknown[];
}

export type BackupError = 'not_json' | 'not_iranti' | 'newer_format' | 'too_large';

export type ParsedBackup = { ok: true; file: BackupFile } | { ok: false; error: BackupError };

export function buildBackup(
  tasks: readonly Task[],
  lists: readonly TaskList[],
  now: number,
): string {
  const file: BackupFile = {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: now,
    tasks: tasks.map(task => ({ ...task, delivery: null })),
    lists: [...lists],
  };
  return JSON.stringify(file, null, 2);
}

export function parseBackup(text: string): ParsedBackup {
  if (text.length > BACKUP_MAX_CHARS) {
    return { ok: false, error: 'too_large' };
  }
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    return { ok: false, error: 'not_json' };
  }
  if (!value || typeof value !== 'object') {
    return { ok: false, error: 'not_iranti' };
  }
  const candidate = value as Record<string, unknown>;
  if (
    candidate.app !== BACKUP_APP ||
    !Array.isArray(candidate.tasks) ||
    !Array.isArray(candidate.lists)
  ) {
    return { ok: false, error: 'not_iranti' };
  }
  if (typeof candidate.format !== 'number' || candidate.format > BACKUP_FORMAT) {
    return { ok: false, error: 'newer_format' };
  }
  return {
    ok: true,
    file: {
      app: BACKUP_APP,
      format: candidate.format,
      exportedAt: typeof candidate.exportedAt === 'number' ? candidate.exportedAt : 0,
      tasks: candidate.tasks,
      lists: candidate.lists,
    },
  };
}

export function backupFileName(now: number): string {
  const date = new Date(now);
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `iranti-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}.json`;
}

export interface ListMergePlan {
  lists: TaskList[];
  remap: Map<string, string>;
}

const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

export function planListMerge(
  current: readonly TaskList[],
  incoming: readonly TaskList[],
): ListMergePlan {
  const lists = current.map(list => ({ ...list }));
  const remap = new Map<string, string>();
  for (const list of incoming) {
    const index = lists.findIndex(existing => existing.id === list.id);
    if (index >= 0) {
      const clash = lists.some(
        existing => existing.id !== list.id && sameName(existing.name, list.name),
      );
      lists[index] = { ...list, name: clash ? lists[index].name : list.name };
      continue;
    }
    const match = lists.find(existing => sameName(existing.name, list.name));
    if (match) {
      remap.set(list.id, match.id);
      continue;
    }
    lists.push({ ...list });
  }
  return { lists, remap };
}

export function mergeTasks(
  current: readonly Task[],
  incoming: readonly Task[],
  remap: ReadonlyMap<string, string>,
  knownListIds: ReadonlySet<string>,
  fallbackListId: string,
): Task[] {
  const byId = new Map(current.map(task => [task.id, task]));
  for (const task of incoming) {
    const listId = remap.get(task.listId) ?? task.listId;
    byId.set(task.id, {
      ...task,
      delivery: null,
      listId: knownListIds.has(listId) ? listId : fallbackListId,
    });
  }
  return [...byId.values()];
}
