import { StyleSheet } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  portraitBackdrop: {
    backgroundColor: Colors.surfaceElevated,
  },
  sm: {
    width: 48,
    height: 48,
  },
  md: {
    width: 68,
    height: 68,
  },
  lg: {
    width: 104,
    height: 104,
  },
  xl: {
    width: 140,
    height: 140,
  },
  badgePortrait: {
    width: '116%',
    height: '116%',
  },
  heroWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroSm: {
    width: 84,
    height: 84,
  },
  heroMd: {
    width: 104,
    height: 104,
  },
  heroLg: {
    width: 128,
    height: 128,
  },
  heroXl: {
    width: 158,
    height: 158,
  },
  heroGlow: {
    position: 'absolute',
    bottom: 4,
    width: '84%',
    height: '74%',
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(20, 20, 99, 0.72)',
    borderWidth: 2,
  },
  heroImage: {
    width: '116%',
    height: '116%',
  },
  initials: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  initialsSm: {
    fontSize: 14,
  },
  initialsLg: {
    fontSize: 28,
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
  tierBadgeHero: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  tierBadgeText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});
