import type { Task, TaskDraft, TaskPatch } from '../types/task';
import { cancelTaskReminder, scheduleTask } from './reminderEngine';
import {
  findTask,
  insertTask,
  markCompleted,
  patchTask,
  removeCompletedRecords,
  removeTaskRecord,
} from './taskRepository';

const SCHEDULING_FIELDS: ReadonlyArray<keyof TaskPatch> = [
  'title',
  'notes',
  'priority',
  'remindAt',
];

export async function createTask(draft: TaskDraft): Promise<Task> {
  const task = insertTask(draft);
  await scheduleTask(task, 'configure');
  return findTask(task.id) ?? task;
}

export async function editTask(id: string, patch: TaskPatch): Promise<Task | null> {
  const task = patchTask(id, patch);
  if (!task) {
    return null;
  }
  if (SCHEDULING_FIELDS.some(field => patch[field] !== undefined)) {
    await scheduleTask(task, 'configure');
  }
  return findTask(id) ?? task;
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task | null> {
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

export async function clearCompleted(): Promise<void> {
  const removed = removeCompletedRecords();
  await Promise.all(removed.map(id => cancelTaskReminder(id)));
}
