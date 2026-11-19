export interface TaskList {
  id: string;
  name: string;
  createdAt: number;
}

export type ListSelection = 'all' | string;
