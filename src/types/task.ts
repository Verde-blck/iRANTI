export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type DeliveryMode = 'deep' | 'standard';

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
}

export interface TaskDraft {
  title: string;
  notes?: string;
  priority?: Priority;
  remindAt?: number | null;
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'notes' | 'priority' | 'remindAt'>>;

export const PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'critical'];
