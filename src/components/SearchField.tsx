import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { strings } from '../i18n/strings';
import { palette } from '../theme/palette';

export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={`mb-4 h-12 flex-row items-center rounded-[12px] border bg-[#000000] pl-4 ${
        focused ? 'border-[#00FF66]' : 'border-radon-25'
      }`}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={strings.search.placeholder}
        placeholderTextColor={palette.fog}
        selectionColor={palette.radon}
        cursorColor={palette.radon}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={strings.search.placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="h-full flex-1 text-[16px] text-ink"
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.search.clear}
          hitSlop={8}
          onPress={() => onChange('')}
          className="h-full justify-center px-4 active:opacity-60">
          <Text className="text-[18px] text-mist">×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
