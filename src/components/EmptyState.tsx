import React from 'react';
import { Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import type { TaskFilter } from './SegmentedTabs';

export function EmptyState({ filter }: { filter: TaskFilter }) {
  const active = filter === 'active';
  return (
    <View className="items-start px-1 py-10">
      <Text className="text-[17px] font-semibold text-ink">
        {active ? strings.empty.activeTitle : strings.empty.doneTitle}
      </Text>
      <Text className="mt-1 text-[15px] text-mist">
        {active ? strings.empty.activeBody : strings.empty.doneBody}
      </Text>
    </View>
  );
}
