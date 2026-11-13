import React from 'react';
import { Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import type { DeliveryMode } from '../types/task';

export function DeliveryTag({ mode }: { mode: DeliveryMode | null }) {
  if (!mode) {
    return null;
  }
  const deep = mode === 'deep';
  return (
    <View className={`rounded-md border px-2 py-0.5 ${deep ? 'border-[#00FF66]' : 'border-fog'}`}>
      <Text className={`text-[11px] font-medium ${deep ? 'text-[#00FF66]' : 'text-mist'}`}>
        {deep ? strings.delivery.deep : strings.delivery.standard}
      </Text>
    </View>
  );
}
