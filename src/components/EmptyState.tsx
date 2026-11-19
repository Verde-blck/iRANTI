import React from 'react';
import { Text, View } from 'react-native';
import { strings } from '../i18n/strings';

export type EmptyVariant = 'active' | 'done' | 'search' | 'list';

const COPY: Record<EmptyVariant, { title: string; body: string }> = {
  active: { title: strings.empty.activeTitle, body: strings.empty.activeBody },
  done: { title: strings.empty.doneTitle, body: strings.empty.doneBody },
  search: { title: strings.empty.searchTitle, body: strings.empty.searchBody },
  list: { title: strings.empty.listTitle, body: strings.empty.listBody },
};

export function EmptyState({ variant }: { variant: EmptyVariant }) {
  const copy = COPY[variant];
  return (
    <View className="items-start px-1 py-10">
      <Text className="text-[17px] font-semibold text-ink">{copy.title}</Text>
      <Text className="mt-1 text-[15px] text-mist">{copy.body}</Text>
    </View>
  );
}
