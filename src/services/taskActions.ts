import { INBOX_LIST_ID } from '../config/constants';
import type { Task, TaskDraft, TaskPatch } from '../types/task';
import { findList } from './listRepository';
import { cancelTaskReminder, scheduleTask } from './reminderEngine';
import {
  findTask,
  insertTask,
  markCompleted,
  patchTask,
  removeCompletedRecords,
  advanceRepeat,
  findTask as findTaskRecord,
  removeTaskRecord,
  toggleSubtaskRecord,
} from './taskRepository';

const SCHEDULING_FIELDS: ReadonlyArray<keyof TaskPatch> = [
  'title',
  'notes',
  'priority',
  'remindAt',
];

function resolveListId(listId: string | undefined): string | undefined {
  if (listId === undefined) {
    return undefined;
  }
  return findList(listId) ? listId : INBOX_LIST_ID;
}

export async function createTask(draft: TaskDraft): Promise<Task> {
  const task = insertTask({ ...draft, listId: resolveListId(draft.listId) });
  await scheduleTask(task, 'configure');
  return findTask(task.id) ?? task;
}

export async function editTask(id: string, patch: TaskPatch): Promise<Task | null> {
  const task = patchTask(id, { ...patch, listId: resolveListId(patch.listId) });
  if (!task) {
    return null;
  }
  if (SCHEDULING_FIELDS.some(field => patch[field] !== undefined)) {
    await scheduleTask(task, 'configure');
  }
  return findTask(id) ?? task;
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task | null> {
  const existing = findTaskRecord(id);
  if (completed && existing?.repeat && existing.remindAt !== null) {
    const advanced = advanceRepeat(id, Date.now());
    if (advanced) {
      await scheduleTask(advanced, 'sync');
    }
    return findTaskRecord(id) ?? advanced;
  }
  const task = markCompleted(id, completed);
  if (!task) {
    return null;
  }
  if (completed) {
    await cancelTaskReminder(id);
  } else {
    await scheduleTask(task, 'sync');
  }
  return findTask(id) ?? task;
}

export function toggleTask(id: string): Promise<Task | null> {
  const task = findTask(id);
  return task ? setTaskCompleted(id, !task.completed) : Promise.resolve(null);
}

export async function deleteTask(id: string): Promise<void> {
  await cancelTaskReminder(id);
  removeTaskRecord(id);
}

export async function clearCompleted(onlyIds?: readonly string[]): Promise<void> {
  const removed = removeCompletedRecords(onlyIds);
  await Promise.all(removed.map(id => cancelTaskReminder(id)));
}

export function toggleSubtask(taskId: string, subtaskId: string): Task | null {
  return toggleSubtaskRecord(taskId, subtaskId);
}
