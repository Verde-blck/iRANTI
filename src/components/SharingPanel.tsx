import React, { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { identity, useStore } from '../core/store';
import { strings } from '../i18n/strings';
import { accountStore } from '../services/accountService';
import {
  SharingError,
  deleteSpace,
  ensureInviteCode,
  leaveSpace,
  newInviteCode,
} from '../services/sharedActions';
import { sharedStore } from '../services/sharedStore';
import { NeonButton } from './NeonButton';

function confirm(title: string, body: string, action: string): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      title,
      body,
      [
        { text: strings.sharing.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: action, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function SharingPanel({ spaceId, onRemoved }: { spaceId: string; onRemoved: () => void }) {
  const shared = useStore(sharedStore, identity);
  const account = useStore(accountStore, identity);
  const [busy, setBusy] = useState<'invite' | 'code' | 'leave' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const space = shared.spaces.find(item => item.id === spaceId);
  if (!space) {
    return null;
  }
  const uid = account.user?.uid ?? shared.uid;
  const isOwner = space.ownerId === uid;
  const others = space.members.filter(member => member !== uid).length;

  const run = async (key: NonNullable<typeof busy>, work: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await work();
    } catch (cause) {
      setError(strings.sharing.errors[cause instanceof SharingError ? cause.code : 'failed']);
    } finally {
      setBusy(null);
    }
  };

  const sendInvite = () =>
    run('invite', async () => {
      const code = await ensureInviteCode(space.id);
      const message =
        space.kind === 'list'
          ? strings.sharing.inviteList(space.name, code)
          : strings.sharing.inviteTask(space.name, code);
      await Share.share({ message });
    });

  const leave = () =>
    run('leave', async () => {
      if (
        await confirm(
          strings.sharing.leaveTitle,
          strings.sharing.leaveBody,
          strings.sharing.confirmLeave,
        )
      ) {
        await leaveSpace(space.id);
        onRemoved();
      }
    });

  const remove = () =>
    run('delete', async () => {
      if (
        await confirm(
          strings.sharing.deleteTitle,
          strings.sharing.deleteBody,
          strings.sharing.confirmDelete,
        )
      ) {
        await deleteSpace(space.id);
        onRemoved();
      }
    });

  return (
    <View>
      <Text className="text-[14px] font-medium text-mist">{strings.sharing.people}</Text>
      {space.members.map(member => (
        <Text key={member} className="mt-1 text-[16px] text-ink">
          {space.memberNames[member] ?? '…'}
          {member === uid ? ` (${strings.sharing.you})` : ''}
          {member === space.ownerId ? `, ${strings.sharing.owner}` : ''}
        </Text>
      ))}
      <Text className="mt-5 text-[14px] font-medium text-mist">{strings.sharing.codeLabel}</Text>
      <Text selectable className="mt-1 text-[28px] font-bold tracking-[6px] text-[#00FF66]">
        {space.inviteCode ?? '······'}
      </Text>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-3 text-[15px] text-flare">
          {error}
        </Text>
      ) : null}
      <View className="mt-5 gap-3">
        <NeonButton
          label={strings.sharing.sendInvite}
          variant="solid"
          busy={busy === 'invite'}
          onPress={sendInvite}
        />
        <NeonButton
          label={strings.sharing.newCode}
          variant="outline"
          busy={busy === 'code'}
          onPress={() =>
            run('code', async () => {
              await newInviteCode(space.id);
            })
          }
        />
        {others > 0 ? (
          <NeonButton
            label={strings.sharing.leave}
            variant="outline"
            busy={busy === 'leave'}
            onPress={leave}
          />
        ) : null}
        {isOwner ? (
          <NeonButton
            label={strings.sharing.deleteForEveryone}
            variant="danger"
            busy={busy === 'delete'}
            onPress={remove}
          />
        ) : null}
      </View>
    </View>
  );
}
