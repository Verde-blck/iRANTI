import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import {
  createList,
  deleteList,
  findList,
  listStore,
  renameList,
} from '../services/listRepository';

export function useLists() {
  const lists = useStore(listStore, identity);
  const names = useMemo(() => new Map(lists.map(list => [list.id, list.name])), [lists]);

  return useMemo(
    () => ({
      lists,
      nameOf: (id: string) => names.get(id) ?? null,
      find: findList,
      create: createList,
      rename: renameList,
      remove: deleteList,
    }),
    [lists, names],
  );
}
