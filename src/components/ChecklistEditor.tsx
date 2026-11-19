import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SUBTASK_LIMIT, TITLE_LIMIT } from '../config/constants';
import { strings } from '../i18n/strings';
import { palette } from '../theme/palette';
import type { Subtask } from '../types/task';
import { createId } from '../utils/id';

export function ChecklistEditor({
  value,
  onChange,
}: {
  value: Subtask[];
  onChange: (value: Subtask[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const full = value.length >= SUBTASK_LIMIT;

  const add = () => {
    const title = draft.trim();
    if (!title || full) {
      return;
    }
    onChange([...value, { id: createId(), title, done: false }]);
    setDraft('');
  };

  return (
    <View>
      {value.map(step => (
        <View
          key={step.id}
          className="mb-2 flex-row items-center rounded-[10px] border border-radon-25 pl-1">
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: step.done }}
            accessibilityLabel={
              step.done
                ? strings.composer.stepDone(step.title)
                : strings.composer.stepNotDone(step.title)
            }
            hitSlop={6}
            onPress={() =>
              onChange(
                value.map(item => (item.id === step.id ? { ...item, done: !item.done } : item)),
              )
            }
            className="items-center justify-center px-3 py-3">
            <View
              className={`h-[20px] w-[20px] items-center justify-center rounded-[6px] border ${
                step.done ? 'border-[#00FF66] bg-[#00FF66]' : 'border-radon-60'
              }`}>
              {step.done ? <Text className="text-[12px] font-bold text-[#000000]">✓</Text> : null}
            </View>
          </Pressable>
          <Text
            numberOfLines={2}
            className={`flex-1 py-3 text-[15px] ${
              step.done ? 'text-fog line-through' : 'text-ink'
            }`}>
            {step.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.composer.removeStep(step.title)}
            hitSlop={6}
            onPress={() => onChange(value.filter(item => item.id !== step.id))}
            className="px-4 py-3 active:opacity-60">
            <Text className="text-[18px] text-mist">×</Text>
          </Pressable>
        </View>
      ))}
      {full ? null : (
        <View className="flex-row items-center gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={strings.composer.checklistPlaceholder}
            placeholderTextColor={palette.fog}
            selectionColor={palette.radon}
            cursorColor={palette.radon}
            maxLength={TITLE_LIMIT}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={add}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`h-12 flex-1 rounded-[12px] border bg-[#000000] px-4 text-[16px] text-ink ${
              focused ? 'border-[#00FF66]' : 'border-radon-25'
            }`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.composer.addStep}
            accessibilityState={{ disabled: !draft.trim() }}
            disabled={!draft.trim()}
            onPress={add}
            className={`h-12 w-12 items-center justify-center rounded-[12px] border border-[#00FF66] active:bg-radon-12 ${
              draft.trim() ? '' : 'opacity-40'
            }`}>
            <Text className="-mt-0.5 text-[24px] font-light text-[#00FF66]">+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
