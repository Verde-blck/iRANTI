import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import { sharedAppTasks, sharedStore } from '../services/sharedStore';
import {
  findAnyTask,
  routeClearCompleted,
  routeCreate,
  routeRemove,
  routeSetCompleted,
  routeToggle,
  routeToggleSubtask,
  routeUpdate,
} from '../services/taskRouter';
import { taskStore } from '../services/taskRepository';
import { compareTasks } from '../utils/taskOrder';

export function useTasks() {
  const local = useStore(taskStore, identity);
  const shared = useStore(sharedStore, identity);
  const ordered = useMemo(
    () => [...local, ...sharedAppTasks(shared)].sort(compareTasks),
    [local, shared],
  );
  const active = useMemo(() => ordered.filter(task => !task.completed), [ordered]);
  const done = useMemo(() => ordered.filter(task => task.completed), [ordered]);

  return useMemo(
    () => ({
      tasks: ordered,
      active,
      done,
      find: findAnyTask,
      create: routeCreate,
      update: routeUpdate,
      toggle: routeToggle,
      toggleSubtask: routeToggleSubtask,
      setCompleted: routeSetCompleted,
      remove: routeRemove,
      clearCompleted: routeClearCompleted,
    }),
    [ordered, active, done],
  );
}
