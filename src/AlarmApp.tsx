import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlarmScreen, type AlarmProps } from './screens/AlarmScreen';
import { palette } from './theme/palette';

export default function AlarmApp(props: AlarmProps) {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={palette.void} />
      <AlarmScreen {...props} />
    </SafeAreaProvider>
  );
}
