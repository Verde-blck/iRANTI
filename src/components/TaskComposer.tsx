import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { strings } from '../i18n/strings';
import { isTaskValidationError } from '../services/taskRepository';
import { palette } from '../theme/palette';
import type { Priority, Task, TaskPatch } from '../types/task';
import { NeonButton } from './NeonButton';
import { PriorityPicker } from './PriorityPicker';
import { ReminderPicker } from './ReminderPicker';

interface TaskComposerProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="mb-2 text-[14px] font-medium text-mist">{label}</Text>
      {children}
    </View>
  );
}

export function TaskComposer({ visible, task, onClose }: TaskComposerProps) {
  const insets = useSafeAreaInsets();
  const { create, update, remove } = useTasks();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [remindAt, setRemindAt] = useState<number | null>(null);
  const [focused, setFocused] = useState<'title' | 'notes' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setPriority(task?.priority ?? 'normal');
    setRemindAt(task?.remindAt ?? null);
    setError(null);
    setBusy(null);
  }, [visible, task]);

  const submit = async () => {
    setBusy('save');
    setError(null);
    try {
      if (task) {
        const patch: TaskPatch = {};
        if (title !== task.title) {
          patch.title = title;
        }
        if (notes !== task.notes) {
          patch.notes = notes;
        }
        if (priority !== task.priority) {
          patch.priority = priority;
        }
        if (remindAt !== task.remindAt) {
          patch.remindAt = remindAt;
        }
        await update(task.id, patch);
      } else {
        await create({ title, notes, priority, remindAt });
      }
      onClose();
    } catch (cause) {
      setError(
        isTaskValidationError(cause)
          ? strings.composer.errors[cause.code]
          : strings.composer.errors.generic,
      );
    } finally {
      setBusy(null);
    }
  };

  const destroy = async () => {
    if (!task) {
      return;
    }
    setBusy('delete');
    try {
      await remove(task.id);
      onClose();
    } catch {
      setError(strings.composer.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  const inputClass = (field: 'title' | 'notes') =>
    `rounded-[12px] border bg-[#000000] px-4 text-[17px] text-ink ${
      focused === field ? 'border-[#00FF66]' : 'border-radon-25'
    }`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/70">
        <View
          className="max-h-[92%] rounded-t-[24px] border-x border-t border-[#00FF66] bg-[#000000]"
          style={{ paddingBottom: insets.bottom + 16 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-6 pb-4 pt-6">
            <Text accessibilityRole="header" className="text-[24px] font-bold text-ink">
              {task ? strings.composer.editTitle : strings.composer.newTitle}
            </Text>

            <Field label={strings.composer.titleLabel}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={strings.composer.titlePlaceholder}
                placeholderTextColor={palette.fog}
                selectionColor={palette.radon}
                cursorColor={palette.radon}
                autoFocus={!task}
                maxLength={140}
                returnKeyType="next"
                onFocus={() => setFocused('title')}
                onBlur={() => setFocused(null)}
                className={`h-14 ${inputClass('title')}`}
              />
            </Field>

            <Field label={strings.composer.notesLabel}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={strings.composer.notesPlaceholder}
                placeholderTextColor={palette.fog}
                selectionColor={palette.radon}
                cursorColor={palette.radon}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                onFocus={() => setFocused('notes')}
                onBlur={() => setFocused(null)}
                className={`min-h-[88px] py-3 ${inputClass('notes')}`}
              />
            </Field>

            <Field label={strings.composer.priorityLabel}>
              <PriorityPicker value={priority} onChange={setPriority} />
            </Field>

            <Field label={strings.composer.reminderLabel}>
              <ReminderPicker value={remindAt} onChange={setRemindAt} />
            </Field>

            {error ? (
              <Text accessibilityLiveRegion="polite" className="mt-5 text-[15px] text-flare">
                {error}
              </Text>
            ) : null}

            <View className="mt-8 gap-3">
              <NeonButton
                label={task ? strings.composer.save : strings.composer.create}
                variant="solid"
                busy={busy === 'save'}
                disabled={busy === 'delete'}
                onPress={submit}
              />
              {task ? (
                <NeonButton
                  label={strings.composer.delete}
                  variant="danger"
                  busy={busy === 'delete'}
                  disabled={busy === 'save'}
                  onPress={destroy}
                />
              ) : null}
              <NeonButton label={strings.composer.cancel} variant="quiet" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
