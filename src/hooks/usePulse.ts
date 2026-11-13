import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function usePulse(active: boolean) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active && !reduceMotion) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      return;
    }
    cancelAnimation(progress);
    progress.value = withTiming(active ? 1 : 0, { duration: 240 });
  }, [active, reduceMotion, progress]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.75,
    transform: [{ scale: 1 + progress.value * 0.03 }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.006 }],
  }));

  return { haloStyle, coreStyle };
}
