import { INBOX_LIST_ID, LIST_LIMIT, LIST_NAME_LIMIT } from '../config/constants';
import { createStore } from '../core/store';
import { strings } from '../i18n/strings';
import { StorageKeys } from '../storage/keys';
import { readJson, writeJson } from '../storage/vault';
import type { TaskList } from '../types/list';
import { createId } from '../utils/id';
import { reassignList } from './taskRepository';

export type ListValidationCode = 'name_required' | 'name_taken' | 'limit_reached';

export class ListValidationError extends Error {
  readonly code: ListValidationCode;

  constructor(code: ListValidationCode) {
    super(code);
    this.name = 'ListValidationError';
    this.code = code;
  }
}

export function isListValidationError(error: unknown): error is ListValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'ListValidationError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export const listStore = createStore<TaskList[]>([]);

let hydrated = false;

function inbox(): TaskList {
  return { id: INBOX_LIST_ID, name: strings.lists.inbox, createdAt: 0 };
}

function isList(value: unknown): value is TaskList {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}

export function ensureListsHydrated(): void {
  if (hydrated) {
    return;
  }
  const stored = readJson<unknown[]>(StorageKeys.lists);
  const lists = Array.isArray(stored)
    ? stored.filter(isList).map(list => ({
        id: list.id,
        name: list.name,
        createdAt: typeof list.createdAt === 'number' ? list.createdAt : 0,
      }))
    : [];
  const withInbox = lists.some(list => list.id === INBOX_LIST_ID) ? lists : [inbox(), ...lists];
  listStore.set(withInbox);
  hydrated = true;
}

function commit(next: TaskList[]): void {
  writeJson(StorageKeys.lists, next);
  listStore.set(next);
}

function cleanName(name: string, exceptId: string | null): string {
  const value = name.trim().replace(/\s+/g, ' ').slice(0, LIST_NAME_LIMIT);
  if (!value) {
    throw new ListValidationError('name_required');
  }
  const taken = listStore
    .get()
    .some(
      list => list.id !== exceptId && list.name.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );
  if (taken) {
    throw new ListValidationError('name_taken');
  }
  return value;
}

export function findList(id: string): TaskList | undefined {
  return listStore.get().find(list => list.id === id);
}

export function createList(name: string): TaskList {
  if (listStore.get().length >= LIST_LIMIT) {
    throw new ListValidationError('limit_reached');
  }
  const list: TaskList = { id: createId(), name: cleanName(name, null), createdAt: Date.now() };
  commit([...listStore.get(), list]);
  return list;
}

export function renameList(id: string, name: string): TaskList | null {
  const current = findList(id);
  if (!current) {
    return null;
  }
  const next = { ...current, name: cleanName(name, id) };
  commit(listStore.get().map(list => (list.id === id ? next : list)));
  return next;
}

export function deleteList(id: string): void {
  if (id === INBOX_LIST_ID || !findList(id)) {
    return;
  }
  reassignList(id, INBOX_LIST_ID);
  commit(listStore.get().filter(list => list.id !== id));
}
