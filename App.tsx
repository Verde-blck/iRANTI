import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrap } from './src/app/bootstrap';
import { PaywallModal } from './src/components/PaywallModal';
import { useAppLifecycle } from './src/hooks/useAppLifecycle';
import { BootScreen } from './src/screens/BootScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { teardownPurchases } from './src/services/purchaseService';
import { palette } from './src/theme/palette';

type Phase = 'booting' | 'ready' | 'failed';

export default function App() {
  const [phase, setPhase] = useState<Phase>('booting');

  const start = useCallback(() => {
    setPhase('booting');
    bootstrap().then(
      () => setPhase('ready'),
      () => setPhase('failed'),
    );
  }, []);

  useEffect(() => {
    start();
    return teardownPurchases;
  }, [start]);

  useAppLifecycle(phase === 'ready');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={palette.void} />
      {phase === 'ready' ? (
        <>
          <HomeScreen />
          <PaywallModal />
        </>
      ) : (
        <BootScreen failed={phase === 'failed'} onRetry={start} />
      )}
    </SafeAreaProvider>
  );
}
