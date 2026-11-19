import React from 'react';
import { View } from 'react-native';
import type { TaskList } from '../types/list';
import { Chip } from './Chip';

export function ListPicker({
  lists,
  value,
  onChange,
}: {
  lists: readonly TaskList[];
  value: string;
  onChange: (listId: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
      {lists.map(list => (
        <Chip
          key={list.id}
          label={list.name}
          selected={list.id === value}
          onPress={() => onChange(list.id)}
        />
      ))}
    </View>
  );
}
