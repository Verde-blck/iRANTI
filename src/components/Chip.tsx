import React from 'react';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  accessibilityHint?: string;
  count?: number;
  badge?: string;
}

export function Chip({
  label,
  onPress,
  onLongPress,
  selected = false,
  accessibilityHint,
  count,
  badge,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[label, badge, count === undefined ? null : String(count)]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      className={`flex-row items-center rounded-full border px-4 py-2 active:opacity-70 ${
        selected ? 'border-[#00FF66] bg-radon-12' : 'border-radon-25'
      }`}>
      <Text className={`text-[14px] ${selected ? 'text-[#00FF66]' : 'text-ink'}`}>{label}</Text>
      {badge ? (
        <Text className="ml-2 text-[11px] uppercase tracking-[1px] text-radon-60">{badge}</Text>
      ) : null}
      {count !== undefined ? (
        <Text className={`ml-2 text-[13px] ${selected ? 'text-[#00FF66]' : 'text-mist'}`}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
