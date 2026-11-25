import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  primary: {
    backgroundColor: Colors.brandOrange,
  },
  primaryPressed: {
    backgroundColor: Colors.brandOrangePressed,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: Typography.body,
    fontWeight: '700',
  },
  primaryLabel: {
    color: Colors.textPrimary,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
});
