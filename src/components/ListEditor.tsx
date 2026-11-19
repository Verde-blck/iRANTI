import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INBOX_LIST_ID, LIST_NAME_LIMIT } from '../config/constants';
import { useLists } from '../hooks/useLists';
import { strings } from '../i18n/strings';
import { isListValidationError } from '../services/listRepository';
import { palette } from '../theme/palette';
import type { TaskList } from '../types/list';
import { NeonButton } from './NeonButton';

interface ListEditorProps {
  visible: boolean;
  list: TaskList | null;
  onClose: () => void;
  onSaved: (list: TaskList) => void;
  onDeleted: (listId: string) => void;
}

export function ListEditor({ visible, list, onClose, onSaved, onDeleted }: ListEditorProps) {
  const insets = useSafeAreaInsets();
  const { create, rename, remove } = useLists();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(list?.name ?? '');
      setError(null);
    }
  }, [visible, list]);

  const save = () => {
    try {
      const saved = list ? rename(list.id, name) : create(name);
      if (saved) {
        onSaved(saved);
      }
      onClose();
    } catch (cause) {
      setError(
        isListValidationError(cause)
          ? strings.lists.errors[cause.code]
          : strings.lists.errors.generic,
      );
    }
  };

  const destroy = () => {
    if (!list) {
      return;
    }
    remove(list.id);
    onDeleted(list.id);
    onClose();
  };

  const isInbox = list?.id === INBOX_LIST_ID;

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
          className="rounded-t-[24px] border-x border-t border-[#00FF66] bg-[#000000] px-6 pt-6"
          style={{ paddingBottom: insets.bottom + 16 }}>
          <Text accessibilityRole="header" className="text-[24px] font-bold text-ink">
            {list ? strings.lists.editorEditTitle : strings.lists.editorNewTitle}
          </Text>
          <Text className="mb-2 mt-6 text-[14px] font-medium text-mist">
            {strings.lists.nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={strings.lists.namePlaceholder}
            placeholderTextColor={palette.fog}
            selectionColor={palette.radon}
            cursorColor={palette.radon}
            autoFocus
            maxLength={LIST_NAME_LIMIT}
            returnKeyType="done"
            onSubmitEditing={save}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`h-14 rounded-[12px] border bg-[#000000] px-4 text-[17px] text-ink ${
              focused ? 'border-[#00FF66]' : 'border-radon-25'
            }`}
          />
          {error ? (
            <Text accessibilityLiveRegion="polite" className="mt-4 text-[15px] text-flare">
              {error}
            </Text>
          ) : null}
          {list ? (
            <Text className="mt-4 text-[14px] text-mist">
              {isInbox ? strings.lists.inboxNote : strings.lists.deleteNote}
            </Text>
          ) : null}
          <View className="mt-6 gap-3">
            <NeonButton
              label={list ? strings.lists.save : strings.lists.create}
              variant="solid"
              onPress={save}
            />
            {list && !isInbox ? (
              <NeonButton label={strings.lists.delete} variant="danger" onPress={destroy} />
            ) : null}
            <NeonButton label={strings.lists.cancel} variant="quiet" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
