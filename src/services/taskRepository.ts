import { INBOX_LIST_ID, NOTES_LIMIT, SUBTASK_LIMIT, TITLE_LIMIT } from '../config/constants';
import { createStore } from '../core/store';
import { StorageKeys } from '../storage/keys';
import { readJson, writeJson } from '../storage/vault';
import {
  PRIORITIES,
  REPEAT_KINDS,
  type DeliveryMode,
  type Priority,
  type Repeat,
  type RepeatKind,
  type Subtask,
  type Task,
  type TaskDraft,
  type TaskPatch,
} from '../types/task';
import { createId } from '../utils/id';
import { nextOccurrence } from '../utils/recurrence';

export type TaskValidationCode = 'title_required' | 'reminder_in_past';

export class TaskValidationError extends Error {
  readonly code: TaskValidationCode;

  constructor(code: TaskValidationCode) {
    super(code);
    this.name = 'TaskValidationError';
    this.code = code;
  }
}

export function isTaskValidationError(error: unknown): error is TaskValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'TaskValidationError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export const taskStore = createStore<Task[]>([]);

let hydrated = false;

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.createdAt === 'number' &&
    PRIORITIES.includes(candidate.priority as Priority)
  );
}

export function cleanSubtasks(value: unknown): Subtask[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const result: Subtask[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const candidate = item as Record<string, unknown>;
    const title =
      typeof candidate.title === 'string' ? candidate.title.trim().slice(0, TITLE_LIMIT) : '';
    if (!title) {
      continue;
    }
    const id =
      typeof candidate.id === 'string' && !seen.has(candidate.id) ? candidate.id : createId();
    seen.add(id);
    result.push({ id, title, done: candidate.done === true });
    if (result.length >= SUBTASK_LIMIT) {
      break;
    }
  }
  return result;
}

export function cleanRepeat(value: unknown, remindAt: number | null): Repeat | null {
  if (remindAt === null || !value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (!REPEAT_KINDS.includes(candidate.kind as RepeatKind)) {
    return null;
  }
  const anchor =
    typeof candidate.anchor === 'number' && Number.isFinite(candidate.anchor)
      ? candidate.anchor
      : remindAt;
  return { kind: candidate.kind as RepeatKind, anchor };
}

function normalise(task: Task): Task {
  const remindAt = typeof task.remindAt === 'number' ? task.remindAt : null;
  return {
    id: task.id,
    title: task.title,
    notes: typeof task.notes === 'string' ? task.notes : '',
    priority: task.priority,
    remindAt,
    completed: task.completed === true,
    completedAt: typeof task.completedAt === 'number' ? task.completedAt : null,
    createdAt: task.createdAt,
    updatedAt: typeof task.updatedAt === 'number' ? task.updatedAt : task.createdAt,
    delivery: task.delivery === 'deep' || task.delivery === 'standard' ? task.delivery : null,
    listId: typeof task.listId === 'string' && task.listId ? task.listId : INBOX_LIST_ID,
    subtasks: cleanSubtasks(task.subtasks),
    repeat: cleanRepeat(task.repeat, remindAt),
  };
}

export function sanitiseTasks(raw: unknown[]): Task[] {
  return raw.filter(isTask).map(normalise);
}

export function importTaskRecords(tasks: Task[]): void {
  commit(tasks);
}

export function ensureTasksHydrated(): void {
  if (hydrated) {
    return;
  }
  const stored = readJson<unknown[]>(StorageKeys.tasks);
  taskStore.set(Array.isArray(stored) ? stored.filter(isTask).map(normalise) : []);
  hydrated = true;
}

function commit(next: Task[]): void {
  writeJson(StorageKeys.tasks, next);
  taskStore.set(next);
}

function cleanTitle(title: string): string {
  const value = title.trim().slice(0, TITLE_LIMIT);
  if (!value) {
    throw new TaskValidationError('title_required');
  }
  return value;
}

function cleanNotes(notes: string | undefined): string {
  return (notes ?? '').trim().slice(0, NOTES_LIMIT);
}

function cleanReminder(remindAt: number | null | undefined, now: number): number | null {
  if (remindAt === null || remindAt === undefined) {
    return null;
  }
  if (!Number.isFinite(remindAt) || remindAt <= now) {
    throw new TaskValidationError('reminder_in_past');
  }
  return Math.floor(remindAt / 1000) * 1000;
}

export function findTask(id: string): Task | undefined {
  return taskStore.get().find(task => task.id === id);
}

export function insertTask(draft: TaskDraft): Task {
  const now = Date.now();
  const remindAt = cleanReminder(draft.remindAt, now);
  const task: Task = {
    id: createId(),
    title: cleanTitle(draft.title),
    notes: cleanNotes(draft.notes),
    priority: draft.priority ?? 'normal',
    remindAt,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    delivery: null,
    listId: draft.listId || INBOX_LIST_ID,
    subtasks: cleanSubtasks(draft.subtasks),
    repeat: cleanRepeat(draft.repeat, remindAt),
  };
  commit([task, ...taskStore.get()]);
  return task;
}

export function patchTask(id: string, patch: TaskPatch): Task | null {
  const current = findTask(id);
  if (!current) {
    return null;
  }
  const now = Date.now();
  const reminderChanged = patch.remindAt !== undefined && patch.remindAt !== current.remindAt;
  const remindAt = reminderChanged ? cleanReminder(patch.remindAt, now) : current.remindAt;
  const repeatSource = patch.repeat !== undefined ? patch.repeat : current.repeat;
  const next: Task = {
    ...current,
    title: patch.title !== undefined ? cleanTitle(patch.title) : current.title,
    notes: patch.notes !== undefined ? cleanNotes(patch.notes) : current.notes,
    priority: patch.priority ?? current.priority,
    remindAt,
    listId: patch.listId || current.listId,
    subtasks: patch.subtasks !== undefined ? cleanSubtasks(patch.subtasks) : current.subtasks,
    repeat: cleanRepeat(repeatSource, remindAt),
    updatedAt: now,
  };
  commit(taskStore.get().map(task => (task.id === id ? next : task)));
  return next;
}

export function markCompleted(id: string, completed: boolean): Task | null {
  const current = findTask(id);
  if (!current) {
    return null;
  }
  if (current.completed === completed) {
    return current;
  }
  const now = Date.now();
  const next: Task = { ...current, completed, completedAt: completed ? now : null, updatedAt: now };
  commit(taskStore.get().map(task => (task.id === id ? next : task)));
  return next;
}

export function advanceRepeat(id: string, after: number): Task | null {
  const current = findTask(id);
  if (!current || !current.repeat || current.remindAt === null) {
    return null;
  }
  const next: Task = {
    ...current,
    remindAt: nextOccurrence(current.repeat, Math.max(after, current.remindAt)),
    completed: false,
    completedAt: null,
    delivery: null,
    subtasks: current.subtasks.map(step => ({ ...step, done: false })),
    updatedAt: Date.now(),
  };
  commit(taskStore.get().map(task => (task.id === id ? next : task)));
  return next;
}

export function advanceOverdueRepeats(now: number): string[] {
  const due = taskStore
    .get()
    .filter(
      task => task.repeat && !task.completed && task.remindAt !== null && task.remindAt <= now,
    );
  if (due.length === 0) {
    return [];
  }
  const ids = new Set(due.map(task => task.id));
  commit(
    taskStore
      .get()
      .map(task =>
        ids.has(task.id) && task.repeat
          ? { ...task, remindAt: nextOccurrence(task.repeat, now), delivery: null, updatedAt: now }
          : task,
      ),
  );
  return [...ids];
}

export function toggleSubtaskRecord(taskId: string, subtaskId: string): Task | null {
  const current = findTask(taskId);
  if (!current) {
    return null;
  }
  const next: Task = {
    ...current,
    subtasks: current.subtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
    ),
    updatedAt: Date.now(),
  };
  commit(taskStore.get().map(task => (task.id === taskId ? next : task)));
  return next;
}

export function reassignList(fromListId: string, toListId: string): void {
  if (!taskStore.get().some(task => task.listId === fromListId)) {
    return;
  }
  const now = Date.now();
  commit(
    taskStore
      .get()
      .map(task =>
        task.listId === fromListId ? { ...task, listId: toListId, updatedAt: now } : task,
      ),
  );
}

export function applyDeliveries(changes: Map<string, DeliveryMode | null>): void {
  if (changes.size === 0) {
    return;
  }
  let changed = false;
  const next = taskStore.get().map(task => {
    const delivery = changes.get(task.id);
    if (delivery === undefined || delivery === task.delivery) {
      return task;
    }
    changed = true;
    return { ...task, delivery };
  });
  if (changed) {
    commit(next);
  }
}

export function removeTaskRecord(id: string): void {
  commit(taskStore.get().filter(task => task.id !== id));
}

export function removeCompletedRecords(onlyIds?: readonly string[]): string[] {
  const scope = onlyIds ? new Set(onlyIds) : null;
  const removable = (task: Task) => task.completed && (scope === null || scope.has(task.id));
  const removed = taskStore
    .get()
    .filter(removable)
    .map(task => task.id);
  if (removed.length > 0) {
    commit(taskStore.get().filter(task => !removable(task)));
  }
  return removed;
}

export function buildTask(draft: TaskDraft, id: string, now: number = Date.now()): Task {
  const remindAt = cleanReminder(draft.remindAt, now);
  return {
    id,
    title: cleanTitle(draft.title),
    notes: cleanNotes(draft.notes),
    priority: draft.priority ?? 'normal',
    remindAt,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    delivery: null,
    listId: draft.listId || INBOX_LIST_ID,
    subtasks: cleanSubtasks(draft.subtasks),
    repeat: cleanRepeat(draft.repeat, remindAt),
  };
}

export function applyTaskPatch(current: Task, patch: TaskPatch, now: number = Date.now()): Task {
  const reminderChanged = patch.remindAt !== undefined && patch.remindAt !== current.remindAt;
  const remindAt = reminderChanged ? cleanReminder(patch.remindAt, now) : current.remindAt;
  return {
    ...current,
    title: patch.title !== undefined ? cleanTitle(patch.title) : current.title,
    notes: patch.notes !== undefined ? cleanNotes(patch.notes) : current.notes,
    priority: patch.priority ?? current.priority,
    remindAt,
    listId: patch.listId || current.listId,
    subtasks: patch.subtasks !== undefined ? cleanSubtasks(patch.subtasks) : current.subtasks,
    repeat: cleanRepeat(patch.repeat !== undefined ? patch.repeat : current.repeat, remindAt),
    updatedAt: now,
  };
}
