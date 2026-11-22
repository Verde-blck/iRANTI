import type { TaskList } from '../src/types/list';
import type { Task } from '../src/types/task';
import {
  backupFileName,
  buildBackup,
  mergeTasks,
  parseBackup,
  planListMerge,
} from '../src/utils/backup';

function task(id: string, listId = 'inbox', title = id): Task {
  return {
    id,
    title,
    notes: '',
    priority: 'normal',
    remindAt: null,
    completed: false,
    completedAt: null,
    createdAt: 0,
    updatedAt: 0,
    delivery: 'deep',
    listId,
    subtasks: [],
    repeat: null,
  };
}

const list = (id: string, name: string): TaskList => ({ id, name, createdAt: 0 });

describe('backup file', () => {
  it('round-trips tasks and lists and drops delivery state', () => {
    const text = buildBackup([task('a')], [list('inbox', 'Inbox')], 1000);
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.file.exportedAt).toBe(1000);
      expect((parsed.file.tasks[0] as Task).delivery).toBeNull();
      expect(parsed.file.lists).toHaveLength(1);
    }
  });

  it('rejects files that are not iRANTI backups', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, error: 'not_json' });
    expect(parseBackup('{"tasks":[],"lists":[]}')).toEqual({ ok: false, error: 'not_iranti' });
    expect(parseBackup('{"app":"iRANTI","format":99,"tasks":[],"lists":[]}')).toEqual({
      ok: false,
      error: 'newer_format',
    });
  });

  it('accepts a file saved with a byte-order mark', () => {
    expect(parseBackup('\uFEFF' + buildBackup([], [], 0)).ok).toBe(true);
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 10, 21, 9).getTime())).toBe(
      'iranti-backup-2026-11-21.json',
    );
  });
});

describe('merging a backup', () => {
  it('merges a same-named list instead of duplicating it', () => {
    const plan = planListMerge(
      [list('inbox', 'Inbox'), list('w1', 'Work')],
      [list('w2', 'work'), list('h', 'Home')],
    );
    expect(plan.lists.map(l => l.name)).toEqual(['Inbox', 'Work', 'Home']);
    expect(plan.remap.get('w2')).toBe('w1');
  });

  it('replaces tasks with the same id, keeps the rest, and repairs unknown lists', () => {
    const merged = mergeTasks(
      [task('a', 'inbox', 'old'), task('b')],
      [task('a', 'inbox', 'new'), task('c', 'w2'), task('d', 'gone')],
      new Map([['w2', 'w1']]),
      new Set(['inbox', 'w1']),
      'inbox',
    );
    expect(merged.map(t => `${t.id}:${t.title}:${t.listId}`)).toEqual([
      'a:new:inbox',
      'b:b:inbox',
      'c:c:w1',
      'd:d:inbox',
    ]);
    expect(merged.every(t => t.delivery === null || t.id === 'b')).toBe(true);
  });
});
