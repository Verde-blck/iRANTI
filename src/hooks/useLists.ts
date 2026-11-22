import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import {
  createList,
  deleteList,
  findList,
  listStore,
  renameList,
} from '../services/listRepository';
import { sharedLists, sharedStore } from '../services/sharedStore';
import type { TaskList } from '../types/list';

export function findAnyList(id: string): TaskList | undefined {
  return findList(id) ?? sharedLists(sharedStore.get()).find(list => list.id === id);
}

export function useLists() {
  const local = useStore(listStore, identity);
  const shared = useStore(sharedStore, identity);
  const lists = useMemo(() => [...local, ...sharedLists(shared)], [local, shared]);
  const names = useMemo(() => new Map(lists.map(list => [list.id, list.name])), [lists]);

  return useMemo(
    () => ({
      lists,
      nameOf: (id: string) => names.get(id) ?? null,
      find: findAnyList,
      create: createList,
      rename: renameList,
      remove: deleteList,
    }),
    [lists, names],
  );
}
