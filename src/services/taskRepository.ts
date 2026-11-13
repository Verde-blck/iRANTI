import { NOTES_LIMIT, TITLE_LIMIT } from '../config/constants';
import { createStore } from '../core/store';
import { StorageKeys } from '../storage/keys';
import { readJson, writeJson } from '../storage/vault';
import {
  PRIORITIES,
  type DeliveryMode,
  type Priority,
  type Task,
  type TaskDraft,
  type TaskPatch,
} from '../types/task';
import { createId } from '../utils/id';

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

function normalise(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    notes: typeof task.notes === 'string' ? task.notes : '',
    priority: task.priority,
    remindAt: typeof task.remindAt === 'number' ? task.remindAt : null,
    completed: task.completed === true,
    completedAt: typeof task.completedAt === 'number' ? task.completedAt : null,
    createdAt: task.createdAt,
    updatedAt: typeof task.updatedAt === 'number' ? task.updatedAt : task.createdAt,
    delivery: task.delivery === 'deep' || task.delivery === 'standard' ? task.delivery : null,
  };
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
  const task: Task = {
    id: createId(),
    title: cleanTitle(draft.title),
    notes: cleanNotes(draft.notes),
    priority: draft.priority ?? 'normal',
    remindAt: cleanReminder(draft.remindAt, now),
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    delivery: null,
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
  const next: Task = {
    ...current,
    title: patch.title !== undefined ? cleanTitle(patch.title) : current.title,
    notes: patch.notes !== undefined ? cleanNotes(patch.notes) : current.notes,
    priority: patch.priority ?? current.priority,
    remindAt: reminderChanged ? cleanReminder(patch.remindAt, now) : current.remindAt,
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

export function removeCompletedRecords(): string[] {
  const removed = taskStore
    .get()
    .filter(task => task.completed)
    .map(task => task.id);
  if (removed.length > 0) {
    commit(taskStore.get().filter(task => !task.completed));
  }
  return removed;
}
