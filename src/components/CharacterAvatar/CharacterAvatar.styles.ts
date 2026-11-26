import { StyleSheet } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
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
    width: 76,
    height: 76,
  },
  portrait: {
    width: '100%',
    height: '100%',
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
  tierBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  tierBadgeText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});
