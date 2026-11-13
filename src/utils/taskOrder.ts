import { PULSE_LEAD_MS } from '../config/constants';
import type { Priority, Task } from '../types/task';

const WEIGHT: Record<Priority, number> = { critical: 3, high: 2, normal: 1, low: 0 };

export function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  if (a.completed) {
    return (b.completedAt ?? 0) - (a.completedAt ?? 0);
  }
  const aTime = a.remindAt ?? Number.POSITIVE_INFINITY;
  const bTime = b.remindAt ?? Number.POSITIVE_INFINITY;
  if (aTime !== bTime) {
    return aTime - bTime;
  }
  if (WEIGHT[a.priority] !== WEIGHT[b.priority]) {
    return WEIGHT[b.priority] - WEIGHT[a.priority];
  }
  return b.createdAt - a.createdAt;
}

export function isHighPriority(priority: Priority): boolean {
  return priority === 'high' || priority === 'critical';
}

export function isApproaching(task: Task, now: number): boolean {
  return (
    !task.completed &&
    task.remindAt !== null &&
    isHighPriority(task.priority) &&
    task.remindAt > now &&
    task.remindAt - now <= PULSE_LEAD_MS
  );
}

export function isOverdue(task: Task, now: number): boolean {
  return !task.completed && task.remindAt !== null && task.remindAt <= now;
}
