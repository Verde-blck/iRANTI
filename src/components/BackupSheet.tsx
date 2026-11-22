import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../i18n/strings';
import {
  applyBackup,
  lastBackupAt,
  pickBackup,
  saveBackup,
  type RestorePreview,
} from '../services/backupService';
import { formatWhen } from '../utils/time';
import { NeonButton } from './NeonButton';

interface Message {
  tone: 'ok' | 'error';
  text: string;
}

function confirmRestore(preview: RestorePreview): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      strings.backup.confirmTitle,
      strings.backup.confirmBody(
        preview.tasks.length,
        preview.lists.length,
        preview.exportedAt ? formatWhen(preview.exportedAt) : null,
      ),
      [
        { text: strings.backup.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: strings.backup.confirm, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function BackupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<'save' | 'restore' | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [last, setLast] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setMessage(null);
      setBusy(null);
      setLast(lastBackupAt());
    }
  }, [visible]);

  const save = async () => {
    setBusy('save');
    setMessage(null);
    try {
      if (await saveBackup()) {
        setLast(lastBackupAt());
        setMessage({ tone: 'ok', text: strings.backup.saved });
      }
    } catch {
      setMessage({ tone: 'error', text: strings.backup.errors.failed });
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    setMessage(null);
    try {
      const result = await pickBackup();
      if (result.status === 'invalid') {
        setMessage({ tone: 'error', text: strings.backup.errors[result.error] });
      } else if (result.status === 'ready' && (await confirmRestore(result.preview))) {
        await applyBackup(result.preview);
        setMessage({
          tone: 'ok',
          text: strings.backup.restored(result.preview.tasks.length, result.preview.lists.length),
        });
      }
    } catch {
      setMessage({ tone: 'error', text: strings.backup.errors.failed });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <View
          className="rounded-t-[24px] border-x border-t border-[#00FF66] bg-[#000000] px-6 pt-6"
          style={{ paddingBottom: insets.bottom + 16 }}>
          <Text accessibilityRole="header" className="text-[24px] font-bold text-ink">
            {strings.backup.title}
          </Text>
          <Text className="mt-3 text-[15px] leading-[22px] text-ink">{strings.backup.intro}</Text>
          <Text className="mt-3 text-[14px] text-mist">
            {last ? strings.backup.lastSaved(formatWhen(last)) : strings.backup.never}
          </Text>
          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              className={`mt-4 text-[15px] ${
                message.tone === 'ok' ? 'text-[#00FF66]' : 'text-flare'
              }`}>
              {message.text}
            </Text>
          ) : null}
          <View className="mt-6 gap-3">
            <NeonButton
              label={strings.backup.save}
              variant="solid"
              busy={busy === 'save'}
              disabled={busy === 'restore'}
              onPress={save}
            />
            <NeonButton
              label={strings.backup.restore}
              variant="outline"
              busy={busy === 'restore'}
              disabled={busy === 'save'}
              onPress={restore}
            />
            <Text className="text-[13px] leading-[19px] text-mist">
              {strings.backup.restoreNote}
            </Text>
            <NeonButton label={strings.backup.close} variant="quiet" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
