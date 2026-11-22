import React from 'react';
import { ScrollView } from 'react-native';
import { strings } from '../i18n/strings';
import type { ListSelection, TaskList } from '../types/list';
import { Chip } from './Chip';

interface ListBarProps {
  lists: readonly TaskList[];
  selected: ListSelection;
  counts: ReadonlyMap<ListSelection, number>;
  onSelect: (selection: ListSelection) => void;
  onEdit: (list: TaskList) => void;
  onCreate: () => void;
}

export function ListBar({ lists, selected, counts, onSelect, onEdit, onCreate }: ListBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      className="-mx-5 mb-4"
      contentContainerClassName="gap-2 px-5">
      <Chip
        label={strings.lists.all}
        count={counts.get('all') ?? 0}
        selected={selected === 'all'}
        onPress={() => onSelect('all')}
      />
      {lists.map(list => (
        <Chip
          key={list.id}
          label={list.name}
          count={counts.get(list.id) ?? 0}
          selected={selected === list.id}
          accessibilityHint={strings.lists.holdHint}
          onPress={() => onSelect(list.id)}
          onLongPress={() => onEdit(list)}
          badge={list.shared ? strings.sharing.badge : undefined}
        />
      ))}
      <Chip label={`+ ${strings.lists.newList}`} onPress={onCreate} />
    </ScrollView>
  );
}
