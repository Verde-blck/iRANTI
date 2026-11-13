import { useMemo } from 'react';
import { identity, useStore } from '../core/store';
import {
  clearCompleted,
  createTask,
  deleteTask,
  editTask,
  setTaskCompleted,
  toggleTask,
} from '../services/taskActions';
import { findTask, taskStore } from '../services/taskRepository';
import { compareTasks } from '../utils/taskOrder';

export function useTasks() {
  const tasks = useStore(taskStore, identity);
  const ordered = useMemo(() => [...tasks].sort(compareTasks), [tasks]);
  const active = useMemo(() => ordered.filter(task => !task.completed), [ordered]);
  const done = useMemo(() => ordered.filter(task => task.completed), [ordered]);

  return useMemo(
    () => ({
      tasks: ordered,
      active,
      done,
      find: findTask,
      create: createTask,
      update: editTask,
      toggle: toggleTask,
      setCompleted: setTaskCompleted,
      remove: deleteTask,
      clearCompleted,
    }),
    [ordered, active, done],
  );
}
