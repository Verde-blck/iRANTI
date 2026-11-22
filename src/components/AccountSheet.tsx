import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identity, useStore } from '../core/store';
import { strings } from '../i18n/strings';
import {
  AccountError,
  accountStore,
  deleteAccount,
  signIn,
  signOut,
} from '../services/accountService';
import { SharingError, joinWithCode, normaliseCode } from '../services/sharedActions';
import { palette } from '../theme/palette';
import { NeonButton } from './NeonButton';

interface Message {
  tone: 'ok' | 'error';
  text: string;
}

function confirmDelete(): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      strings.account.deleteTitle,
      strings.account.deleteBody,
      [
        { text: strings.account.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: strings.account.deleteConfirm, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

function messageFor(error: unknown): Message {
  if (error instanceof SharingError) {
    return { tone: 'error', text: strings.sharing.errors[error.code] };
  }
  const code = error instanceof AccountError ? error.code : 'failed';
  return { tone: 'error', text: strings.account.errors[code] };
}

export function AccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const account = useStore(accountStore, identity);
  const [busy, setBusy] = useState<'signIn' | 'signOut' | 'delete' | 'join' | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (visible) {
      setBusy(null);
      setMessage(null);
    }
  }, [visible]);

  const run = async (
    action: 'signIn' | 'signOut' | 'delete' | 'join',
    work: () => Promise<Message | null>,
  ) => {
    setBusy(action);
    setMessage(null);
    try {
      setMessage(await work());
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(null);
    }
  };

  const user = account.user;

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
            {strings.account.title}
          </Text>
          {account.status === 'starting' ? (
            <Text className="mt-3 text-[15px] text-mist">{strings.account.starting}</Text>
          ) : user ? (
            <View className="mt-3">
              <Text className="text-[14px] text-mist">{strings.account.signedInAs}</Text>
              {user.name ? (
                <Text className="mt-1 text-[18px] font-semibold text-ink">{user.name}</Text>
              ) : null}
              {user.email ? (
                <Text className="mt-0.5 text-[15px] text-mist">{user.email}</Text>
              ) : null}
            </View>
          ) : (
            <Text className="mt-3 text-[15px] leading-[22px] text-ink">
              {strings.account.signedOutBody}
            </Text>
          )}
          {user ? (
            <View className="mt-6">
              <Text className="mb-2 text-[14px] font-medium text-mist">
                {strings.sharing.joinLabel}
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={code}
                  onChangeText={value => setCode(normaliseCode(value).slice(0, 6))}
                  placeholder={strings.sharing.joinPlaceholder}
                  placeholderTextColor={palette.fog}
                  selectionColor={palette.radon}
                  cursorColor={palette.radon}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  className="h-12 flex-1 rounded-[12px] border border-radon-25 bg-[#000000] px-4 text-[18px] tracking-[4px] text-ink"
                />
                <NeonButton
                  label={strings.sharing.join}
                  variant="outline"
                  busy={busy === 'join'}
                  disabled={code.length !== 6 || (busy !== null && busy !== 'join')}
                  onPress={() =>
                    run('join', async () => {
                      const name = await joinWithCode(code);
                      setCode('');
                      return { tone: 'ok', text: strings.sharing.joined(name) };
                    })
                  }
                />
              </View>
            </View>
          ) : null}
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
            {account.status === 'signedOut' ? (
              <NeonButton
                label={strings.account.signIn}
                variant="solid"
                busy={busy === 'signIn'}
                onPress={() =>
                  run('signIn', async () => {
                    await signIn();
                    return null;
                  })
                }
              />
            ) : null}
            {user ? (
              <>
                <NeonButton
                  label={strings.account.signOut}
                  variant="outline"
                  busy={busy === 'signOut'}
                  disabled={busy !== null && busy !== 'signOut'}
                  onPress={() =>
                    run('signOut', async () => {
                      await signOut();
                      return null;
                    })
                  }
                />
                <NeonButton
                  label={strings.account.delete}
                  variant="danger"
                  busy={busy === 'delete'}
                  disabled={busy !== null && busy !== 'delete'}
                  onPress={() =>
                    run('delete', async () => {
                      if (!(await confirmDelete())) {
                        return null;
                      }
                      return (await deleteAccount())
                        ? { tone: 'ok', text: strings.account.deleted }
                        : null;
                    })
                  }
                />
              </>
            ) : null}
            <NeonButton label={strings.account.close} variant="quiet" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
