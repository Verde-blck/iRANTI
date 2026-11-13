import React from 'react';
import { Pressable, Text } from 'react-native';
import { useLicense } from '../hooks/useLicense';
import { strings } from '../i18n/strings';
import { formatRemaining } from '../utils/time';

export function LicenseBadge() {
  const { status, remainingMs, showPaywall } = useLicense();
  const label =
    status === 'premium'
      ? strings.license.premium
      : status === 'trial'
      ? strings.license.trial(formatRemaining(remainingMs))
      : status === 'expired'
      ? strings.license.expired
      : status === 'tampered'
      ? strings.license.tampered
      : strings.license.booting;
  const warning = status === 'expired' || status === 'tampered';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={showPaywall}
      className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
        warning ? 'border-flare' : 'border-[#00FF66]'
      }`}>
      <Text className={`text-[13px] font-medium ${warning ? 'text-flare' : 'text-[#00FF66]'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
