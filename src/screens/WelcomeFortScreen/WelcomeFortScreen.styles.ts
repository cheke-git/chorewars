import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: Typography.label,
  },
  card: {
    backgroundColor: 'rgba(11, 11, 74, 0.94)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 4,
  },
  inviteItem: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.brandOrange,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  inviteFort: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  inviteSub: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  inviteNote: {
    color: Colors.brandOrange,
    fontSize: Typography.label,
    fontStyle: 'italic',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signOutText: {
    color: Colors.textMuted,
    fontSize: Typography.caption,
  },
});
