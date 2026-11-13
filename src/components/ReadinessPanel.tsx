import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useReminders } from '../hooks/useReminders';
import { strings } from '../i18n/strings';

export function ReadinessPanel() {
  const { issues, resolve } = useReminders();
  if (issues.length === 0) {
    return null;
  }
  return (
    <View className="mb-5 rounded-[14px] border border-flare px-5 py-4">
      <Text className="text-[15px] font-semibold text-flare">{strings.readiness.title}</Text>
      {issues.map(issue => (
        <View key={issue} className="mt-3 flex-row items-center justify-between">
          <Text className="flex-1 pr-4 text-[15px] text-ink">{strings.readiness[issue]}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${strings.readiness.fix}: ${strings.readiness[issue]}`}
            onPress={() => {
              resolve(issue).catch(() => undefined);
            }}
            className="rounded-full border border-[#00FF66] px-4 py-1.5 active:opacity-70">
            <Text className="text-[14px] font-semibold text-[#00FF66]">
              {strings.readiness.fix}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
