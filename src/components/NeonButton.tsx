import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { palette } from '../theme/palette';

export type NeonButtonVariant = 'solid' | 'outline' | 'quiet' | 'danger';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: NeonButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  accessibilityHint?: string;
  className?: string;
}

const SURFACE: Record<NeonButtonVariant, string> = {
  solid: 'bg-[#00FF66] border border-[#00FF66]',
  outline: 'bg-[#000000] border border-[#00FF66]',
  quiet: 'bg-transparent',
  danger: 'bg-[#000000] border border-flare',
};

const LABEL: Record<NeonButtonVariant, string> = {
  solid: 'text-[#000000]',
  outline: 'text-[#00FF66]',
  quiet: 'text-mist',
  danger: 'text-flare',
};

export function NeonButton({
  label,
  onPress,
  variant = 'outline',
  disabled = false,
  busy = false,
  accessibilityHint,
  className = '',
}: NeonButtonProps) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-full px-6 active:opacity-70 ${
        SURFACE[variant]
      } ${disabled ? 'opacity-40' : ''} ${className}`}>
      {busy ? (
        <ActivityIndicator color={variant === 'solid' ? palette.void : palette.radon} />
      ) : (
        <Text className={`text-[16px] font-semibold ${LABEL[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
