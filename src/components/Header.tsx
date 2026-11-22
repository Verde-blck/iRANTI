import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { LicenseBadge } from './LicenseBadge';

function HeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      className="px-1 py-1 active:opacity-60">
      <Text className="text-[13px] font-medium text-mist underline">{label}</Text>
    </Pressable>
  );
}

export function Header({
  onOpenBackup,
  onOpenAccount,
}: {
  onOpenBackup: () => void;
  onOpenAccount: () => void;
}) {
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
        <View className="mt-2 flex-row gap-3">
          <HeaderLink label={strings.backup.open} onPress={onOpenBackup} />
          <HeaderLink label={strings.account.open} onPress={onOpenAccount} />
        </View>
      </View>
    </View>
  );
}
