import type { Task } from '../src/types/task';
import { filterTasks, matchesQuery, subtaskProgress } from '../src/utils/taskFilters';

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'id',
    title: 'Task',
    notes: '',
    priority: 'normal',
    remindAt: null,
    completed: false,
    completedAt: null,
    createdAt: 0,
    updatedAt: 0,
    delivery: null,
    listId: 'inbox',
    subtasks: [],
    repeat: null,
    ...overrides,
  };
}

const tasks: Task[] = [
  task({ id: 'a', title: 'Pay rent', listId: 'home' }),
  task({ id: 'b', title: 'Revise IFRS 16', notes: 'Lease accounting chapter', listId: 'exams' }),
  task({
    id: 'c',
    title: 'Pack for trip',
    listId: 'home',
    subtasks: [
      { id: 's1', title: 'Passport', done: true },
      { id: 's2', title: 'Charger', done: false },
    ],
  }),
];

describe('filterTasks', () => {
  it('returns everything for All with no search', () => {
    expect(filterTasks(tasks, { list: 'all', query: '' }).map(t => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps only the selected list', () => {
    expect(filterTasks(tasks, { list: 'home', query: '' }).map(t => t.id)).toEqual(['a', 'c']);
  });

  it('combines list and search', () => {
    expect(filterTasks(tasks, { list: 'home', query: 'rent' }).map(t => t.id)).toEqual(['a']);
  });
});

describe('matchesQuery', () => {
  it('ignores case and surrounding spaces', () => {
    expect(matchesQuery(tasks[1], '  ifrs ')).toBe(true);
  });

  it('searches notes and checklist steps', () => {
    expect(matchesQuery(tasks[1], 'lease')).toBe(true);
    expect(matchesQuery(tasks[2], 'passport')).toBe(true);
    expect(matchesQuery(tasks[0], 'passport')).toBe(false);
  });
});

describe('subtaskProgress', () => {
  it('counts finished steps', () => {
    expect(subtaskProgress(tasks[2].subtasks)).toEqual({ done: 1, total: 2 });
    expect(subtaskProgress([])).toEqual({ done: 0, total: 0 });
  });
});
