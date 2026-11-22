import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { LicenseBadge } from './LicenseBadge';

export function Header({ onOpenBackup }: { onOpenBackup: () => void }) {
  return (
    <View className="flex-row items-start justify-between px-5 pb-5 pt-3">
      <View className="flex-1 pr-3">
        <Text accessibilityRole="header" className="text-[28px] font-bold tracking-tight text-ink">
          i<Text className="text-[#00FF66]">RANTI</Text>
        </Text>
        <Text className="mt-0.5 text-[13px] text-mist">{strings.header.tagline}</Text>
      </View>
      <View className="items-end">
        <LicenseBadge />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.backup.title}
          hitSlop={8}
          onPress={onOpenBackup}
          className="mt-2 px-1 py-1 active:opacity-60">
          <Text className="text-[13px] font-medium text-mist underline">{strings.backup.open}</Text>
        </Pressable>
      </View>
    </View>
  );
}
