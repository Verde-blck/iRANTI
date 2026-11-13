import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get: () => T;
  set: (next: T | ((previous: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: next => {
      const value = typeof next === 'function' ? (next as (previous: T) => T)(state) : next;
      if (Object.is(value, state)) {
        return;
      }
      state = value;
      listeners.forEach(listener => listener());
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  const read = () => selector(store.get());
  return useSyncExternalStore(store.subscribe, read, read);
}

export const identity = <T>(value: T): T => value;
