import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackupSheet } from '../components/BackupSheet';
import { EmptyState, type EmptyVariant } from '../components/EmptyState';
import { Fab } from '../components/Fab';
import { Header } from '../components/Header';
import { ListBar } from '../components/ListBar';
import { ListEditor } from '../components/ListEditor';
import { NextUpCard } from '../components/NextUpCard';
import { ReadinessPanel } from '../components/ReadinessPanel';
import { SearchField } from '../components/SearchField';
import { SegmentedTabs, type TaskFilter as TabFilter } from '../components/SegmentedTabs';
import { TaskCard } from '../components/TaskCard';
import { TaskComposer } from '../components/TaskComposer';
import { INBOX_LIST_ID } from '../config/constants';
import { useLists } from '../hooks/useLists';
import { useNow } from '../hooks/useNow';
import { useTasks } from '../hooks/useTasks';
import type { ListSelection, TaskList } from '../types/list';
import type { Task } from '../types/task';
import { filterTasks } from '../utils/taskFilters';

interface EditorState {
  visible: boolean;
  task: Task | null;
}

interface ListEditorState {
  visible: boolean;
  list: TaskList | null;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { active, done, toggle, clearCompleted } = useTasks();
  const { lists, nameOf, find } = useLists();
  const now = useNow(15_000);
  const [tab, setTab] = useState<TabFilter>('active');
  const [selection, setSelection] = useState<ListSelection>('all');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorState>({ visible: false, task: null });
  const [listEditor, setListEditor] = useState<ListEditorState>({ visible: false, list: null });
  const [backupVisible, setBackupVisible] = useState(false);

  const current: ListSelection = selection === 'all' || find(selection) ? selection : 'all';
  const visibleActive = useMemo(
    () => filterTasks(active, { list: current, query }),
    [active, current, query],
  );
  const visibleDone = useMemo(
    () => filterTasks(done, { list: current, query }),
    [done, current, query],
  );
  const counts = useMemo(() => {
    const map = new Map<ListSelection, number>([['all', active.length]]);
    lists.forEach(list => map.set(list.id, 0));
    active.forEach(task => map.set(task.listId, (map.get(task.listId) ?? 0) + 1));
    return map;
  }, [active, lists]);
  const showListNames = current === 'all' && lists.length > 1;

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
    clearCompleted(visibleDone.map(task => task.id)).catch(() => undefined);
  }, [clearCompleted, visibleDone]);
  const onListSaved = useCallback(
    (list: TaskList) => {
      if (!listEditor.list) {
        setSelection(list.id);
      }
    },
    [listEditor.list],
  );
  const onListDeleted = useCallback((listId: string) => {
    setSelection(previous => (previous === listId ? 'all' : previous));
  }, []);

  const renderItem: ListRenderItem<Task> = useCallback(
    ({ item }) => (
      <View className="px-5">
        <TaskCard
          task={item}
          now={now}
          listName={showListNames ? nameOf(item.listId) : null}
          onOpen={openTask}
          onToggle={onToggle}
        />
      </View>
    ),
    [now, showListNames, nameOf, openTask, onToggle],
  );

  const emptyVariant: EmptyVariant = query.trim()
    ? 'search'
    : tab === 'done'
    ? 'done'
    : current !== 'all'
    ? 'list'
    : 'active';

  return (
    <View className="flex-1 bg-[#000000]" style={{ paddingTop: insets.top }}>
      <FlatList
        data={tab === 'active' ? visibleActive : visibleDone}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={now}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={
          <>
            <Header onOpenBackup={() => setBackupVisible(true)} />
            <View className="px-5">
              <NextUpCard tasks={active} />
              <ReadinessPanel />
              <ListBar
                lists={lists}
                selected={current}
                counts={counts}
                onSelect={setSelection}
                onEdit={list => setListEditor({ visible: true, list })}
                onCreate={() => setListEditor({ visible: true, list: null })}
              />
              <SearchField value={query} onChange={setQuery} />
              <SegmentedTabs
                value={tab}
                counts={{ active: visibleActive.length, done: visibleDone.length }}
                onChange={setTab}
                onClearDone={onClearDone}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="px-5">
            <EmptyState variant={emptyVariant} />
          </View>
        }
      />
      <Fab onPress={openNew} bottom={insets.bottom + 24} />
      <TaskComposer
        visible={editor.visible}
        task={editor.task}
        defaultListId={current === 'all' ? INBOX_LIST_ID : current}
        onClose={closeEditor}
      />
      <BackupSheet visible={backupVisible} onClose={() => setBackupVisible(false)} />
      <ListEditor
        visible={listEditor.visible}
        list={listEditor.list}
        onClose={() => setListEditor({ visible: false, list: null })}
        onSaved={onListSaved}
        onDeleted={onListDeleted}
      />
    </View>
  );
}
