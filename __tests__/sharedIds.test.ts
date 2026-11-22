jest.mock('react-native-mmkv', () => ({ MMKV: jest.fn() }));

import {
  SHARED_TASKS_LIST_ID,
  isSharedListId,
  parseSharedTaskId,
  parseSpaceListId,
  sharedAppTasks,
  sharedLists,
  sharedTaskId,
  spaceListId,
  toSpace,
} from '../src/services/sharedStore';

const task = {
  id: 't1',
  title: 'Milk',
  notes: '',
  priority: 'normal' as const,
  remindAt: null,
  completed: false,
  completedAt: null,
  createdAt: 1,
  updatedAt: 1,
  delivery: null,
  listId: 'inbox',
  subtasks: [],
  repeat: null,
};

describe('shared ids', () => {
  it('round-trips task and list ids', () => {
    expect(parseSharedTaskId(sharedTaskId('abc', 't1'))).toEqual({ spaceId: 'abc', taskId: 't1' });
    expect(parseSharedTaskId('localtask')).toBeNull();
    expect(parseSpaceListId(spaceListId('abc'))).toBe('abc');
    expect(isSharedListId(SHARED_TASKS_LIST_ID)).toBe(true);
    expect(isSharedListId('inbox')).toBe(false);
  });
});

describe('shared view', () => {
  const state = {
    uid: 'u1',
    spaces: [
      toSpace('L', {
        kind: 'list',
        name: 'Shopping',
        ownerId: 'u1',
        members: ['u1', 'u2'],
        memberNames: { u1: 'Ade' },
      }),
      toSpace('T', { kind: 'task', name: 'Parcel', ownerId: 'u2', members: ['u1', 'u2'] }),
    ],
    tasks: { L: [task], T: [{ ...task, id: 't2', title: 'Parcel' }] },
  };

  it('maps shared tasks into lists the app understands', () => {
    const mapped = sharedAppTasks(state);
    expect(mapped.map(t => `${t.id}|${t.listId}`)).toEqual([
      `s:L:t1|space:L`,
      `s:T:t2|${SHARED_TASKS_LIST_ID}`,
    ]);
  });

  it('shows shared lists plus one Shared tasks list', () => {
    expect(sharedLists(state).map(list => list.id)).toEqual(['space:L', SHARED_TASKS_LIST_ID]);
  });

  it('cleans malformed space data', () => {
    const space = toSpace('X', { members: ['a', 5], memberNames: { a: 'A', b: 3 } });
    expect(space.kind).toBe('list');
    expect(space.members).toEqual(['a']);
    expect(space.memberNames).toEqual({ a: 'A' });
  });
});
