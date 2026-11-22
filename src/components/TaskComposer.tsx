import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identity, useStore } from '../core/store';
import { INBOX_LIST_ID, NOTES_LIMIT, TITLE_LIMIT } from '../config/constants';
import { useLists } from '../hooks/useLists';
import { useTasks } from '../hooks/useTasks';
import { strings } from '../i18n/strings';
import { accountStore } from '../services/accountService';
import { SharingError, shareTask } from '../services/sharedActions';
import { SHARED_TASKS_LIST_ID, parseSharedTaskId } from '../services/sharedStore';
import { isTaskValidationError } from '../services/taskRepository';
import { palette } from '../theme/palette';
import type { Priority, Repeat, RepeatKind, Subtask, Task, TaskPatch } from '../types/task';
import { ChecklistEditor } from './ChecklistEditor';
import { ListPicker } from './ListPicker';
import { NeonButton } from './NeonButton';
import { PriorityPicker } from './PriorityPicker';
import { ReminderPicker } from './ReminderPicker';
import { RepeatPicker } from './RepeatPicker';
import { SharingPanel } from './SharingPanel';

interface TaskComposerProps {
  visible: boolean;
  task: Task | null;
  defaultListId: string;
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

function sameSubtasks(a: readonly Subtask[], b: readonly Subtask[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (step, index) =>
        step.id === b[index].id && step.title === b[index].title && step.done === b[index].done,
    )
  );
}

function sameRepeat(a: Repeat | null, b: Repeat | null): boolean {
  return a === b || (a !== null && b !== null && a.kind === b.kind && a.anchor === b.anchor);
}

export function TaskComposer({ visible, task, defaultListId, onClose }: TaskComposerProps) {
  const insets = useSafeAreaInsets();
  const { create, update, remove } = useTasks();
  const { lists, find: findList } = useLists();
  const account = useStore(accountStore, identity);
  const [sharing, setSharing] = useState(false);
  const sharedRef = task ? parseSharedTaskId(task.id) : null;
  const sharedSingle = task?.listId === SHARED_TASKS_LIST_ID;
  const pickerLists = lists.filter(list => list.id !== SHARED_TASKS_LIST_ID);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [remindAt, setRemindAt] = useState<number | null>(null);
  const [listId, setListId] = useState(INBOX_LIST_ID);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [repeatKind, setRepeatKind] = useState<RepeatKind | null>(null);
  const [focused, setFocused] = useState<'title' | 'notes' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const initialList = task?.listId ?? defaultListId;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setPriority(task?.priority ?? 'normal');
    setRemindAt(task?.remindAt ?? null);
    setListId(findList(initialList) ? initialList : INBOX_LIST_ID);
    setSubtasks(task?.subtasks ?? []);
    setRepeatKind(task?.repeat?.kind ?? null);
    setError(null);
    setBusy(null);
  }, [visible, task, defaultListId, findList]);

  const resolveRepeat = (current: Task | null): Repeat | null => {
    if (repeatKind === null || remindAt === null) {
      return null;
    }
    if (current?.repeat && current.repeat.kind === repeatKind && current.remindAt === remindAt) {
      return current.repeat;
    }
    return { kind: repeatKind, anchor: remindAt };
  };

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
        if (listId !== task.listId) {
          patch.listId = listId;
        }
        if (!sameSubtasks(subtasks, task.subtasks)) {
          patch.subtasks = subtasks;
        }
        const repeat = resolveRepeat(task);
        if (!sameRepeat(repeat, task.repeat)) {
          patch.repeat = repeat;
        }
        await update(task.id, patch);
      } else {
        await create({
          title,
          notes,
          priority,
          remindAt,
          listId,
          subtasks,
          repeat: resolveRepeat(null),
        });
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
                maxLength={TITLE_LIMIT}
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
                maxLength={NOTES_LIMIT}
                textAlignVertical="top"
                onFocus={() => setFocused('notes')}
                onBlur={() => setFocused(null)}
                className={`min-h-[88px] py-3 ${inputClass('notes')}`}
              />
            </Field>

            <Field label={strings.composer.checklistLabel}>
              <ChecklistEditor value={subtasks} onChange={setSubtasks} />
            </Field>

            <Field label={strings.composer.listLabel}>
              {sharedSingle ? (
                <Text className="text-[15px] text-ink">{strings.sharing.sharedTasks}</Text>
              ) : (
                <ListPicker lists={pickerLists} value={listId} onChange={setListId} />
              )}
            </Field>

            <Field label={strings.composer.priorityLabel}>
              <PriorityPicker value={priority} onChange={setPriority} />
            </Field>

            <Field label={strings.composer.reminderLabel}>
              <ReminderPicker value={remindAt} onChange={setRemindAt} />
            </Field>

            {remindAt !== null ? (
              <Field label={strings.repeat.label}>
                <RepeatPicker value={repeatKind} onChange={setRepeatKind} />
              </Field>
            ) : null}

            {task && sharedRef && sharedSingle ? (
              <Field label={strings.sharing.sharedWith}>
                <SharingPanel spaceId={sharedRef.spaceId} onRemoved={onClose} />
              </Field>
            ) : null}

            {task && !sharedRef ? (
              <View className="mt-6">
                {account.status === 'signedIn' ? (
                  <NeonButton
                    label={strings.sharing.shareTask}
                    variant="outline"
                    busy={sharing}
                    onPress={async () => {
                      setSharing(true);
                      setError(null);
                      try {
                        const result = await shareTask(task.id);
                        onClose();
                        await Share.share({
                          message: strings.sharing.inviteTask(result.name, result.code),
                        });
                      } catch (cause) {
                        setError(
                          strings.sharing.errors[
                            cause instanceof SharingError ? cause.code : 'failed'
                          ],
                        );
                      } finally {
                        setSharing(false);
                      }
                    }}
                  />
                ) : (
                  <Text className="text-[13px] text-mist">{strings.sharing.signInFirst}</Text>
                )}
              </View>
            ) : null}

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
