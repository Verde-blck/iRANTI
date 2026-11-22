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
import { LIST_NAME_LIMIT } from '../config/constants';
import { identity, useStore } from '../core/store';
import { strings } from '../i18n/strings';
import { SharingError, renameSpace } from '../services/sharedActions';
import { sharedStore } from '../services/sharedStore';
import { palette } from '../theme/palette';
import { NeonButton } from './NeonButton';
import { SharingPanel } from './SharingPanel';

interface SharedListSheetProps {
  spaceId: string | null;
  onClose: () => void;
  onRemoved: () => void;
}

export function SharedListSheet({ spaceId, onClose, onRemoved }: SharedListSheetProps) {
  const insets = useSafeAreaInsets();
  const shared = useStore(sharedStore, identity);
  const space = spaceId ? shared.spaces.find(item => item.id === spaceId) : undefined;
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(space?.name ?? '');
    setError(null);
  }, [spaceId, space?.name]);

  const save = async () => {
    if (!space) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renameSpace(space.id, name);
    } catch (cause) {
      setError(strings.sharing.errors[cause instanceof SharingError ? cause.code : 'failed']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={Boolean(space)}
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
          {space ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="px-6 pb-4 pt-6">
              <Text accessibilityRole="header" className="text-[24px] font-bold text-ink">
                {space.name}
              </Text>
              <Text className="mb-2 mt-6 text-[14px] font-medium text-mist">
                {strings.sharing.nameLabel}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={LIST_NAME_LIMIT}
                placeholderTextColor={palette.fog}
                selectionColor={palette.radon}
                cursorColor={palette.radon}
                className="h-14 rounded-[12px] border border-radon-25 bg-[#000000] px-4 text-[17px] text-ink"
              />
              {name.trim() && name.trim() !== space.name ? (
                <NeonButton
                  label={strings.sharing.save}
                  variant="outline"
                  busy={busy}
                  onPress={save}
                  className="mt-3"
                />
              ) : null}
              {error ? <Text className="mt-3 text-[15px] text-flare">{error}</Text> : null}
              <View className="mt-8">
                <SharingPanel spaceId={space.id} onRemoved={onRemoved} />
              </View>
              <NeonButton
                label={strings.sharing.close}
                variant="quiet"
                onPress={onClose}
                className="mt-3"
              />
            </ScrollView>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
