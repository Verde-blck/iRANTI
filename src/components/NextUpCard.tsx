import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNow } from '../hooks/useNow';
import { usePulse } from '../hooks/usePulse';
import { strings } from '../i18n/strings';
import { glow } from '../theme/glow';
import type { Task } from '../types/task';
import { isApproaching } from '../utils/taskOrder';
import { formatCountdown, formatWhen } from '../utils/time';
import { DeliveryTag } from './DeliveryTag';

export function NextUpCard({ tasks }: { tasks: Task[] }) {
  const now = useNow(1000);
  const next = useMemo(
    () =>
      tasks.find(task => !task.completed && task.remindAt !== null && task.remindAt > now) ?? null,
    [tasks, now],
  );
  const { haloStyle, coreStyle } = usePulse(next ? isApproaching(next, now) : false);

  if (!next || next.remindAt === null) {
    return (
      <View className="mb-5 rounded-[20px] border border-radon-25 px-6 py-6">
        <Text className="text-[20px] font-semibold text-ink">{strings.next.emptyTitle}</Text>
        <Text className="mt-1.5 text-[15px] leading-[22px] text-mist">
          {strings.next.emptyBody}
        </Text>
      </View>
    );
  }

  const countdown = formatCountdown(next.remindAt - now);

  return (
    <View className="mb-5">
      <Animated.View pointerEvents="none" style={[glow.hero, haloStyle]} />
      <Animated.View style={coreStyle}>
        <View
          accessible
          accessibilityLabel={`${strings.next.label} ${countdown}. ${next.title}. ${formatWhen(
            next.remindAt,
            now,
          )}`}
          className="rounded-[20px] border border-[#00FF66] bg-[#000000] px-6 py-6">
          <Text className="text-[15px] text-mist">{strings.next.label}</Text>
          <Text
            style={glow.figures}
            className="mt-1 text-[56px] font-extralight leading-[64px] text-[#00FF66]">
            {countdown}
          </Text>
          <Text
            numberOfLines={2}
            className="mt-3 text-[19px] font-semibold leading-[25px] text-ink">
            {next.title}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Text className="text-[14px] text-mist">{formatWhen(next.remindAt, now)}</Text>
            <Text className="text-[14px] text-mist">{strings.priority[next.priority]}</Text>
            <DeliveryTag mode={next.delivery} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
