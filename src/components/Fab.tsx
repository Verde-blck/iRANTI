import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { glow } from '../theme/glow';

export function Fab({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  return (
    <View pointerEvents="box-none" className="absolute right-5" style={{ bottom }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.composer.newTitle}
        onPress={onPress}
        style={glow.fab}
        className="h-16 w-16 items-center justify-center rounded-full border border-[#00FF66] bg-[#000000] active:bg-radon-12">
        <Text className="-mt-0.5 text-[32px] font-light text-[#00FF66]">+</Text>
      </Pressable>
    </View>
  );
}
