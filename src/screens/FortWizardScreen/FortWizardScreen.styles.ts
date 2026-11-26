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
    maxWidth: 520,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  topRow: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  signOutBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  signOutText: {
    color: Colors.textMuted,
    fontSize: Typography.caption,
  },
  stepBar: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepPill: {
    color: Colors.brandOrange,
    fontSize: Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeading: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    lineHeight: 20,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  chipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Typography.label,
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: '600',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  counterValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  memberMeta: {
    flex: 1,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: '700',
  },
  memberSub: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  removeText: {
    color: Colors.error,
    fontSize: Typography.caption,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
  },
  avatarChoice: {
    padding: 3,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceActive: {
    borderColor: Colors.brandOrange,
  },
  previewList: {
    gap: Spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  previewTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.label,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  previewXp: {
    color: Colors.brandOrange,
    fontSize: Typography.label,
    fontWeight: '800',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.label,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
