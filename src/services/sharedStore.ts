import { createStore } from '../core/store';
import { strings } from '../i18n/strings';
import { StorageKeys } from '../storage/keys';
import { readJson, writeJson } from '../storage/vault';
import type { TaskList } from '../types/list';
import type { Task } from '../types/task';
import { sanitiseTasks } from './taskRepository';

export type SpaceKind = 'list' | 'task';

export interface SharedSpace {
  id: string;
  kind: SpaceKind;
  name: string;
  ownerId: string;
  members: string[];
  memberNames: Record<string, string>;
  inviteCode: string | null;
}

export interface SharedState {
  uid: string | null;
  spaces: SharedSpace[];
  tasks: Record<string, Task[]>;
}

export const SHARED_TASKS_LIST_ID = 'shared-tasks';
const TASK_PREFIX = 's:';
const LIST_PREFIX = 'space:';
const EMPTY: SharedState = { uid: null, spaces: [], tasks: {} };

export const sharedStore = createStore<SharedState>(EMPTY);

let hydrated = false;

export const sharedTaskId = (spaceId: string, taskId: string) =>
  `${TASK_PREFIX}${spaceId}:${taskId}`;
export const spaceListId = (spaceId: string) => `${LIST_PREFIX}${spaceId}`;

export function parseSharedTaskId(id: string): { spaceId: string; taskId: string } | null {
  if (!id.startsWith(TASK_PREFIX)) {
    return null;
  }
  const [spaceId, taskId] = id.slice(TASK_PREFIX.length).split(':');
  return spaceId && taskId ? { spaceId, taskId } : null;
}

export function parseSpaceListId(listId: string): string | null {
  return listId.startsWith(LIST_PREFIX) ? listId.slice(LIST_PREFIX.length) || null : null;
}

export function isSharedListId(listId: string): boolean {
  return listId === SHARED_TASKS_LIST_ID || parseSpaceListId(listId) !== null;
}

export function toSpace(id: string, data: Record<string, unknown>): SharedSpace {
  const members = Array.isArray(data.members)
    ? data.members.filter((m): m is string => typeof m === 'string')
    : [];
  const names =
    data.memberNames && typeof data.memberNames === 'object'
      ? (data.memberNames as Record<string, unknown>)
      : {};
  return {
    id,
    kind: data.kind === 'task' ? 'task' : 'list',
    name: typeof data.name === 'string' && data.name ? data.name : strings.sharing.untitled,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    members,
    memberNames: Object.fromEntries(
      Object.entries(names).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
    inviteCode: typeof data.inviteCode === 'string' ? data.inviteCode : null,
  };
}

export function hydrateSharedCache(): void {
  if (hydrated) {
    return;
  }
  hydrated = true;
  const cached = readJson<SharedState>(StorageKeys.sharedCache);
  if (cached && Array.isArray(cached.spaces) && cached.tasks && typeof cached.tasks === 'object') {
    const tasks: Record<string, Task[]> = {};
    Object.entries(cached.tasks).forEach(([spaceId, list]) => {
      tasks[spaceId] = Array.isArray(list) ? sanitiseTasks(list) : [];
    });
    sharedStore.set({
      uid: typeof cached.uid === 'string' ? cached.uid : null,
      spaces: cached.spaces.map(space =>
        toSpace(space.id, space as unknown as Record<string, unknown>),
      ),
      tasks,
    });
  }
  sharedStore.subscribe(() => writeJson(StorageKeys.sharedCache, sharedStore.get()));
}

export function setSharedUser(uid: string | null): void {
  sharedStore.set(state => (state.uid === uid ? state : { ...EMPTY, uid }));
}

export function clearShared(): void {
  sharedStore.set(EMPTY);
}

export function setSpaces(spaces: SharedSpace[]): void {
  sharedStore.set(state => {
    const keep = new Set(spaces.map(space => space.id));
    const tasks = Object.fromEntries(Object.entries(state.tasks).filter(([id]) => keep.has(id)));
    return { ...state, spaces, tasks };
  });
}

export function setSpaceTasks(spaceId: string, raw: unknown[]): void {
  sharedStore.set(state => ({
    ...state,
    tasks: { ...state.tasks, [spaceId]: sanitiseTasks(raw) },
  }));
}

export function findSpace(spaceId: string): SharedSpace | undefined {
  return sharedStore.get().spaces.find(space => space.id === spaceId);
}

export function findSharedTask(spaceId: string, taskId: string): Task | undefined {
  return sharedStore.get().tasks[spaceId]?.find(task => task.id === taskId);
}

export function sharedAppTasks(state: SharedState): Task[] {
  return state.spaces.flatMap(space =>
    (state.tasks[space.id] ?? []).map(task => ({
      ...task,
      id: sharedTaskId(space.id, task.id),
      listId: space.kind === 'list' ? spaceListId(space.id) : SHARED_TASKS_LIST_ID,
      delivery: null,
    })),
  );
}

export function sharedLists(state: SharedState): TaskList[] {
  const lists: TaskList[] = state.spaces
    .filter(space => space.kind === 'list')
    .map(space => ({
      id: spaceListId(space.id),
      name: space.name,
      createdAt: 0,
      shared: true,
      spaceId: space.id,
    }));
  if (state.spaces.some(space => space.kind === 'task')) {
    lists.push({
      id: SHARED_TASKS_LIST_ID,
      name: strings.sharing.sharedTasks,
      createdAt: 0,
      shared: true,
    });
  }
  return lists;
}
