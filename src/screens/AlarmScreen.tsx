import React, { useEffect, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureCore } from '../app/bootstrap';
import { NeonButton } from '../components/NeonButton';
import { SNOOZE_MINUTES } from '../config/constants';
import { useNow } from '../hooks/useNow';
import { usePulse } from '../hooks/usePulse';
import { strings } from '../i18n/strings';
import { AlarmBridge } from '../native/AlarmBridge';
import { setTaskCompleted } from '../services/taskActions';
import { glow } from '../theme/glow';
import { PRIORITIES, type Priority } from '../types/task';
import { formatClock, formatDay } from '../utils/time';

export interface AlarmProps {
  taskId?: string | null;
  title?: string | null;
  body?: string | null;
  priority?: string | null;
  fireAt?: number | null;
}

type AlarmAction = 'complete' | 'snooze' | 'dismiss';

function toPriority(value: string | null | undefined): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : 'normal';
}

export function AlarmScreen({ taskId, title, body, priority, fireAt }: AlarmProps) {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const { haloStyle, coreStyle } = usePulse(true);
  const [busy, setBusy] = useState<AlarmAction | null>(null);
  const level = toPriority(priority);
  const id = taskId ?? '';

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const run = async (action: AlarmAction, work: () => Promise<void>) => {
    if (busy) {
      return;
    }
    setBusy(action);
    try {
      await work();
    } finally {
      setBusy(null);
    }
  };

  const complete = () =>
    run('complete', async () => {
      if (id) {
        await ensureCore().catch(() => undefined);
        await setTaskCompleted(id, true).catch(() => undefined);
      }
      await AlarmBridge.dismiss(id);
    });

  const snooze = () => run('snooze', () => AlarmBridge.snooze(id, SNOOZE_MINUTES));
  const dismiss = () => run('dismiss', () => AlarmBridge.dismiss(id));

  return (
    <View
      className="flex-1 justify-between bg-[#000000] px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="items-center">
        <Text
          style={glow.figures}
          className="text-[72px] font-extralight leading-[80px] text-[#00FF66]">
          {formatClock(now)}
        </Text>
        <Text className="mt-1 text-[16px] text-mist">{formatDay(now, now)}</Text>
      </View>

      <View className="items-center">
        <View className="h-[240px] w-[240px] items-center justify-center">
          <Animated.View pointerEvents="none" style={[glow.ring, haloStyle]} />
          <Animated.View style={coreStyle}>
            <View
              className={`h-[150px] w-[150px] items-center justify-center rounded-full border ${
                level === 'critical' ? 'border-flare' : 'border-[#00FF66]'
              }`}>
              <Text
                className={`text-[17px] font-semibold ${
                  level === 'critical' ? 'text-flare' : 'text-[#00FF66]'
                }`}>
                {strings.priority[level]}
              </Text>
            </View>
          </Animated.View>
        </View>
        <Text
          accessibilityRole="header"
          numberOfLines={3}
          className="mt-6 text-center text-[28px] font-bold leading-[34px] text-ink">
          {title || strings.alarm.fallbackBody[level]}
        </Text>
        {body ? (
          <Text numberOfLines={4} className="mt-3 text-center text-[17px] leading-[24px] text-mist">
            {body}
          </Text>
        ) : null}
        {fireAt ? (
          <Text className="mt-3 text-[15px] text-fog">
            {strings.alarm.scheduled(formatClock(fireAt))}
          </Text>
        ) : null}
      </View>

      <View className="gap-3">
        <NeonButton
          label={strings.alarm.complete}
          variant="solid"
          busy={busy === 'complete'}
          onPress={complete}
        />
        <NeonButton
          label={strings.alarm.snooze(SNOOZE_MINUTES)}
          variant="outline"
          busy={busy === 'snooze'}
          onPress={snooze}
        />
        <NeonButton
          label={strings.alarm.dismiss}
          variant="quiet"
          busy={busy === 'dismiss'}
          onPress={dismiss}
        />
      </View>
    </View>
  );
}
