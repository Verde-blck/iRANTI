import type { Task, TaskDraft, TaskPatch } from '../types/task';
import {
  createSharedTask,
  removeSharedTask,
  setSharedCompleted,
  toggleSharedSubtask,
  updateSharedTask,
} from './sharedActions';
import {
  findSharedTask,
  parseSharedTaskId,
  parseSpaceListId,
  sharedAppTasks,
  sharedStore,
} from './sharedStore';
import {
  clearCompleted,
  createTask,
  deleteTask,
  editTask,
  setTaskCompleted,
  toggleSubtask,
} from './taskActions';
import { findTask } from './taskRepository';

export function findAnyTask(id: string): Task | undefined {
  const shared = parseSharedTaskId(id);
  if (!shared) {
    return findTask(id);
  }
  return sharedAppTasks(sharedStore.get()).find(task => task.id === id);
}

function draftFrom(task: Task, patch: TaskPatch): TaskDraft {
  const remindAt = patch.remindAt !== undefined ? patch.remindAt : task.remindAt;
  return {
    title: patch.title ?? task.title,
    notes: patch.notes ?? task.notes,
    priority: patch.priority ?? task.priority,
    remindAt: remindAt !== null && remindAt <= Date.now() ? null : remindAt,
    subtasks: patch.subtasks ?? task.subtasks,
    repeat: patch.repeat !== undefined ? patch.repeat : task.repeat,
  };
}

export async function routeCreate(draft: TaskDraft): Promise<void> {
  const spaceId = draft.listId ? parseSpaceListId(draft.listId) : null;
  if (spaceId) {
    await createSharedTask(spaceId, draft);
    return;
  }
  await createTask(draft);
}

export async function routeUpdate(id: string, patch: TaskPatch): Promise<void> {
  const task = findAnyTask(id);
  if (!task) {
    return;
  }
  const shared = parseSharedTaskId(id);
  const movingTo = patch.listId && patch.listId !== task.listId ? patch.listId : null;
  if (movingTo) {
    await routeCreate({ ...draftFrom(task, patch), listId: movingTo });
    await routeRemove(id);
    return;
  }
  if (shared) {
    await updateSharedTask(shared.spaceId, shared.taskId, patch);
    return;
  }
  await editTask(id, patch);
}

export async function routeSetCompleted(id: string, completed: boolean): Promise<void> {
  const shared = parseSharedTaskId(id);
  if (shared) {
    await setSharedCompleted(shared.spaceId, shared.taskId, completed);
    return;
  }
  await setTaskCompleted(id, completed);
}

export async function routeToggle(id: string): Promise<void> {
  const task = findAnyTask(id);
  if (task) {
    await routeSetCompleted(id, !task.completed);
  }
}

export async function routeToggleSubtask(id: string, subtaskId: string): Promise<void> {
  const shared = parseSharedTaskId(id);
  if (shared) {
    await toggleSharedSubtask(shared.spaceId, shared.taskId, subtaskId);
    return;
  }
  toggleSubtask(id, subtaskId);
}

export async function routeRemove(id: string): Promise<void> {
  const shared = parseSharedTaskId(id);
  if (shared) {
    if (findSharedTask(shared.spaceId, shared.taskId)) {
      await removeSharedTask(shared.spaceId, shared.taskId);
    }
    return;
  }
  await deleteTask(id);
}

export async function routeClearCompleted(ids: readonly string[]): Promise<void> {
  const local = ids.filter(id => !parseSharedTaskId(id));
  const shared = ids.filter(id => parseSharedTaskId(id));
  await clearCompleted(local);
  for (const id of shared) {
    await routeRemove(id);
  }
}
