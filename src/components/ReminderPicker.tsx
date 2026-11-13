import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { strings } from '../i18n/strings';
import { palette } from '../theme/palette';
import { ceilToMinute, formatWhen, nextOccurrence, tomorrowAt } from '../utils/time';

interface ReminderPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

interface Preset {
  key: string;
  label: string;
  resolve: (now: number) => number | null;
}

const PRESETS: Preset[] = [
  { key: 'none', label: strings.reminder.none, resolve: () => null },
  {
    key: 'plus15',
    label: strings.reminder.plus15,
    resolve: now => ceilToMinute(now + 15 * 60_000),
  },
  {
    key: 'plus60',
    label: strings.reminder.plus60,
    resolve: now => ceilToMinute(now + 60 * 60_000),
  },
  { key: 'tonight', label: strings.reminder.tonight, resolve: now => nextOccurrence(21, 0, now) },
  { key: 'morning', label: strings.reminder.morning, resolve: now => tomorrowAt(8, 0, now) },
];

function Chip({
  label,
  onPress,
  selected = false,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2 active:opacity-70 ${
        selected ? 'border-[#00FF66] bg-radon-12' : 'border-radon-25'
      }`}>
      <Text className={`text-[14px] ${selected ? 'text-[#00FF66]' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

function withoutSeconds(date: Date): number {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy.getTime();
}

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  const [inlineOpen, setInlineOpen] = useState(false);
  const seed = value && value > Date.now() ? value : ceilToMinute(Date.now() + 30 * 60_000);

  const openCustom = () => {
    if (Platform.OS !== 'android') {
      setInlineOpen(open => !open);
      return;
    }
    DateTimePickerAndroid.open({
      value: new Date(seed),
      mode: 'date',
      minimumDate: new Date(),
      onChange: (dateEvent, date) => {
        if (dateEvent.type !== 'set' || !date) {
          return;
        }
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type === 'set' && time) {
              onChange(withoutSeconds(time));
            }
          },
        });
      },
    });
  };

  const onInlineChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      onChange(withoutSeconds(date));
    }
  };

  return (
    <View>
      <Text className={`mb-3 text-[17px] font-semibold ${value ? 'text-[#00FF66]' : 'text-mist'}`}>
        {value ? formatWhen(value) : strings.reminder.off}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map(preset => (
          <Chip
            key={preset.key}
            label={preset.label}
            selected={preset.key === 'none' && value === null}
            onPress={() => {
              setInlineOpen(false);
              onChange(preset.resolve(Date.now()));
            }}
          />
        ))}
        <Chip label={strings.reminder.custom} selected={inlineOpen} onPress={openCustom} />
      </View>
      {Platform.OS === 'ios' && inlineOpen ? (
        <View className="mt-3 overflow-hidden rounded-[14px] border border-radon-25">
          <DateTimePicker
            value={new Date(seed)}
            mode="datetime"
            display="inline"
            themeVariant="dark"
            accentColor={palette.radon}
            minimumDate={new Date()}
            onChange={onInlineChange}
          />
        </View>
      ) : null}
    </View>
  );
}
