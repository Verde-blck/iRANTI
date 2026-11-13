import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { PRIORITIES, type Priority } from '../types/task';

const SELECTED: Record<Priority, string> = {
  low: 'border-mist bg-mist',
  normal: 'border-radon-60 bg-radon-60',
  high: 'border-[#00FF66] bg-[#00FF66]',
  critical: 'border-flare bg-flare',
};

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row gap-2">
      {PRIORITIES.map(level => {
        const selected = level === value;
        return (
          <Pressable
            key={level}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(level)}
            className={`h-11 flex-1 items-center justify-center rounded-[10px] border ${
              selected ? SELECTED[level] : 'border-radon-25'
            }`}>
            <Text
              className={`text-[14px] font-semibold ${selected ? 'text-[#000000]' : 'text-mist'}`}>
              {strings.priority[level]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
