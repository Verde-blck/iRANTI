import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';

export type TaskFilter = 'active' | 'done';

interface SegmentedTabsProps {
  value: TaskFilter;
  counts: Record<TaskFilter, number>;
  onChange: (value: TaskFilter) => void;
  onClearDone: () => void;
}

const TABS: TaskFilter[] = ['active', 'done'];

export function SegmentedTabs({ value, counts, onChange, onClearDone }: SegmentedTabsProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <View accessibilityRole="tablist" className="flex-row gap-5">
        {TABS.map(tab => {
          const selected = tab === value;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(tab)}
              className={`border-b-2 pb-1.5 ${
                selected ? 'border-[#00FF66]' : 'border-transparent'
              }`}>
              <Text className={`text-[17px] font-semibold ${selected ? 'text-ink' : 'text-fog'}`}>
                {strings.list[tab]} <Text className="font-normal text-mist">{counts[tab]}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value === 'done' && counts.done > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClearDone}
          hitSlop={8}
          className="active:opacity-60">
          <Text className="text-[14px] text-mist">{strings.list.clear}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
