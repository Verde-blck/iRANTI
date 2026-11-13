import { StyleSheet } from 'react-native';
import { palette } from './palette';

const neon = {
  borderWidth: 1,
  borderColor: palette.radon,
  shadowColor: palette.radon,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 12,
} as const;

export const glow = StyleSheet.create({
  card: {
    ...neon,
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 13,
  },
  hero: {
    ...neon,
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    shadowRadius: 18,
  },
  ring: {
    ...neon,
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowRadius: 24,
  },
  fab: {
    shadowColor: palette.radon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  figures: { fontVariant: ['tabular-nums'] },
});
