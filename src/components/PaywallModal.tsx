import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identity, useStore } from '../core/store';
import { useLicense } from '../hooks/useLicense';
import { usePulse } from '../hooks/usePulse';
import { strings } from '../i18n/strings';
import { closePaywall, paywallStore } from '../services/paywall';
import { glow } from '../theme/glow';
import { formatRemaining } from '../utils/time';
import { NeonButton } from './NeonButton';

export function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { visible, reason } = useStore(paywallStore, identity);
  const { status, isPremium, remainingMs, purchase, buy, restore } = useLicense();
  const lapsed = status === 'expired' || status === 'tampered';
  const { haloStyle, coreStyle } = usePulse(visible && lapsed);

  const message = isPremium
    ? strings.paywall.activeMessage
    : lapsed
    ? strings.paywall.expiredMessage
    : strings.paywall.trialMessage(formatRemaining(remainingMs));

  const note =
    isPremium || !lapsed
      ? null
      : reason === 'reminder_configured'
      ? strings.paywall.configuredNote
      : reason === 'reminder_executed'
      ? strings.paywall.executedNote
      : null;

  const activateLabel = purchase.price
    ? strings.paywall.activateWithPrice(purchase.price)
    : strings.paywall.activate;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closePaywall}>
      <View
        className="flex-1 justify-center bg-black/90 px-5"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View>
          <Animated.View pointerEvents="none" style={[glow.hero, haloStyle]} />
          <Animated.View style={coreStyle}>
            <ScrollView
              bounces={false}
              className="max-h-[640px] rounded-[20px] border border-[#00FF66] bg-[#000000]"
              contentContainerClassName="px-6 py-7">
              <Text
                accessibilityRole="header"
                className="text-[26px] font-bold leading-[32px] text-ink">
                {strings.paywall.title}
              </Text>
              <Text className="mt-3 text-[17px] leading-[25px] text-ink">{message}</Text>
              {note ? (
                <Text className="mt-3 text-[15px] leading-[22px] text-mist">{note}</Text>
              ) : null}

              {isPremium ? null : (
                <View className="mt-6 gap-3">
                  {strings.paywall.perks.map(perk => (
                    <View key={perk} className="flex-row items-center">
                      <View className="mr-3 h-2 w-2 rounded-full bg-[#00FF66]" />
                      <Text className="flex-1 text-[15px] text-ink">{perk}</Text>
                    </View>
                  ))}
                </View>
              )}

              {purchase.error ? (
                <Text accessibilityLiveRegion="polite" className="mt-5 text-[15px] text-flare">
                  {purchase.error}
                </Text>
              ) : null}

              <View className="mt-8 gap-3">
                {isPremium ? (
                  <NeonButton
                    label={strings.paywall.close}
                    variant="outline"
                    onPress={closePaywall}
                  />
                ) : (
                  <>
                    <NeonButton
                      label={activateLabel}
                      variant="solid"
                      busy={purchase.phase === 'purchasing' || purchase.phase === 'connecting'}
                      disabled={purchase.phase === 'unavailable' || purchase.phase === 'restoring'}
                      onPress={() => {
                        buy().catch(() => undefined);
                      }}
                    />
                    <NeonButton
                      label={strings.paywall.restore}
                      variant="outline"
                      busy={purchase.phase === 'restoring'}
                      disabled={purchase.phase === 'purchasing'}
                      onPress={() => {
                        restore().catch(() => undefined);
                      }}
                    />
                    <NeonButton
                      label={strings.paywall.dismiss}
                      variant="quiet"
                      onPress={closePaywall}
                    />
                  </>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
