import type { ListSelection } from '../types/list';
import type { Subtask, Task } from '../types/task';

export interface TaskFilter {
  list: ListSelection;
  query: string;
}

export function normaliseQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

export function matchesQuery(task: Task, query: string): boolean {
  const needle = normaliseQuery(query);
  if (!needle) {
    return true;
  }
  const haystack = [task.title, task.notes, ...task.subtasks.map(subtask => subtask.title)];
  return haystack.some(text => text.toLocaleLowerCase().includes(needle));
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  return tasks.filter(
    task =>
      (filter.list === 'all' || task.listId === filter.list) && matchesQuery(task, filter.query),
  );
}

export function subtaskProgress(subtasks: readonly Subtask[]): { done: number; total: number } {
  return { done: subtasks.filter(subtask => subtask.done).length, total: subtasks.length };
}
