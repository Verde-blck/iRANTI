export interface TaskList {
  id: string;
  name: string;
  createdAt: number;
  shared?: boolean;
  spaceId?: string;
}

export type ListSelection = 'all' | string;
