import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { NeonButton } from '../components/NeonButton';
import { usePulse } from '../hooks/usePulse';
import { strings } from '../i18n/strings';
import { glow } from '../theme/glow';

export function BootScreen({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  const { haloStyle } = usePulse(!failed);
  return (
    <View className="flex-1 items-center justify-center bg-[#000000] px-10">
      <View className="h-[240px] w-[240px] items-center justify-center">
        <Animated.View pointerEvents="none" style={[glow.ring, haloStyle]} />
        <Text className="text-[34px] font-bold tracking-tight text-ink">
          i<Text className="text-[#00FF66]">RANTI</Text>
        </Text>
      </View>
      {failed ? (
        <View className="mt-6 w-full items-center">
          <Text
            accessibilityLiveRegion="polite"
            className="text-center text-[16px] leading-[23px] text-ink">
            {strings.boot.failed}
          </Text>
          <NeonButton label={strings.boot.retry} onPress={onRetry} className="mt-6 self-stretch" />
        </View>
      ) : null}
    </View>
  );
}
