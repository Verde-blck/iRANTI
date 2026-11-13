import React from 'react';
import { Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { LicenseBadge } from './LicenseBadge';

export function Header() {
  return (
    <View className="flex-row items-center justify-between px-5 pb-5 pt-3">
      <View>
        <Text accessibilityRole="header" className="text-[28px] font-bold tracking-tight text-ink">
          i<Text className="text-[#00FF66]">RANTI</Text>
        </Text>
        <Text className="mt-0.5 text-[13px] text-mist">{strings.header.tagline}</Text>
      </View>
      <LicenseBadge />
    </View>
  );
}
