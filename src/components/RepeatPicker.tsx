import React from 'react';
import { Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { REPEAT_KINDS, type RepeatKind } from '../types/task';
import { Chip } from './Chip';

export function RepeatPicker({
  value,
  onChange,
}: {
  value: RepeatKind | null;
  onChange: (value: RepeatKind | null) => void;
}) {
  return (
    <View>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        <Chip
          label={strings.repeat.never}
          selected={value === null}
          onPress={() => onChange(null)}
        />
        {REPEAT_KINDS.map(kind => (
          <Chip
            key={kind}
            label={strings.repeat.options[kind]}
            selected={value === kind}
            onPress={() => onChange(kind)}
          />
        ))}
      </View>
      {value ? <Text className="mt-3 text-[13px] text-mist">{strings.repeat.hint}</Text> : null}
    </View>
  );
}
