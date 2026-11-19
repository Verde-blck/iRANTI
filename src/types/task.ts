export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type DeliveryMode = 'deep' | 'standard';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  remindAt: number | null;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  delivery: DeliveryMode | null;
  listId: string;
  subtasks: Subtask[];
}

export interface TaskDraft {
  title: string;
  notes?: string;
  priority?: Priority;
  remindAt?: number | null;
  listId?: string;
  subtasks?: Subtask[];
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'notes' | 'priority' | 'remindAt' | 'listId' | 'subtasks'>
>;

export const PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'critical'];
