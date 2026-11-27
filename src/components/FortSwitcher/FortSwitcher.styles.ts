import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 11, 74, 0.92)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    fontWeight: '800',
  },
  pillTextActive: {
    color: Colors.textPrimary,
  },
  roleDot: {
    color: Colors.brandOrange,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  roleDotActive: {
    color: Colors.background,
  },
});
