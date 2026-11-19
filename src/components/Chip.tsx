import React from 'react';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  accessibilityHint?: string;
  count?: number;
}

export function Chip({
  label,
  onPress,
  onLongPress,
  selected = false,
  accessibilityHint,
  count,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      className={`flex-row items-center rounded-full border px-4 py-2 active:opacity-70 ${
        selected ? 'border-[#00FF66] bg-radon-12' : 'border-radon-25'
      }`}>
      <Text className={`text-[14px] ${selected ? 'text-[#00FF66]' : 'text-ink'}`}>{label}</Text>
      {count !== undefined ? (
        <Text className={`ml-2 text-[13px] ${selected ? 'text-[#00FF66]' : 'text-mist'}`}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
