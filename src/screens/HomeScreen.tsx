import React, { useCallback, useState } from 'react';
import { FlatList, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';
import { Header } from '../components/Header';
import { NextUpCard } from '../components/NextUpCard';
import { ReadinessPanel } from '../components/ReadinessPanel';
import { SegmentedTabs, type TaskFilter } from '../components/SegmentedTabs';
import { TaskCard } from '../components/TaskCard';
import { TaskComposer } from '../components/TaskComposer';
import { useNow } from '../hooks/useNow';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types/task';

interface EditorState {
  visible: boolean;
  task: Task | null;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { active, done, toggle, clearCompleted } = useTasks();
  const now = useNow(15_000);
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [editor, setEditor] = useState<EditorState>({ visible: false, task: null });

  const openNew = useCallback(() => setEditor({ visible: true, task: null }), []);
  const openTask = useCallback((task: Task) => setEditor({ visible: true, task }), []);
  const closeEditor = useCallback(() => setEditor({ visible: false, task: null }), []);
  const onToggle = useCallback(
    (task: Task) => {
      toggle(task.id).catch(() => undefined);
    },
    [toggle],
  );
  const onClearDone = useCallback(() => {
    clearCompleted().catch(() => undefined);
  }, [clearCompleted]);

  const renderItem: ListRenderItem<Task> = useCallback(
    ({ item }) => (
      <View className="px-5">
        <TaskCard task={item} now={now} onOpen={openTask} onToggle={onToggle} />
      </View>
    ),
    [now, openTask, onToggle],
  );

  return (
    <View className="flex-1 bg-[#000000]" style={{ paddingTop: insets.top }}>
      <FlatList
        data={filter === 'active' ? active : done}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={now}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={
          <>
            <Header />
            <View className="px-5">
              <NextUpCard tasks={active} />
              <ReadinessPanel />
              <SegmentedTabs
                value={filter}
                counts={{ active: active.length, done: done.length }}
                onChange={setFilter}
                onClearDone={onClearDone}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="px-5">
            <EmptyState filter={filter} />
          </View>
        }
      />
      <Fab onPress={openNew} bottom={insets.bottom + 24} />
      <TaskComposer visible={editor.visible} task={editor.task} onClose={closeEditor} />
    </View>
  );
}
