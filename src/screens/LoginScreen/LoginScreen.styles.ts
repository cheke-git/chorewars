import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.body,
  },
  feedback: {
    color: Colors.brandOrange,
    fontSize: Typography.label,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.label,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  apiFooter: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  apiPill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  apiPillText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  apiSuccess: {
    color: Colors.success,
    fontSize: Typography.caption,
    textAlign: 'center',
  },
  apiError: {
    color: Colors.error,
    fontSize: Typography.caption,
    textAlign: 'center',
  },
});
