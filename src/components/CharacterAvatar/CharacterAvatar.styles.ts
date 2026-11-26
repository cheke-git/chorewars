import { StyleSheet } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sm: {
    width: 36,
    height: 36,
  },
  md: {
    width: 52,
    height: 52,
  },
  lg: {
    width: 72,
    height: 72,
  },
  highlighted: {
    borderColor: Colors.brandOrange,
    borderWidth: 3,
  },
  initials: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  initialsSm: {
    fontSize: 13,
  },
  initialsLg: {
    fontSize: 26,
  },
});
