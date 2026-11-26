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
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fortName: {
    color: Colors.brandOrange,
    fontSize: Typography.label,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.subtitle,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  profileCard: {
    width: 170,
    backgroundColor: 'rgba(11, 11, 74, 0.94)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  profileCardPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  profileCardLocked: {
    borderColor: Colors.brandOrange,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: '800',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  profileRank: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  profileXp: {
    color: Colors.brandOrange,
    fontSize: Typography.label,
    fontWeight: '800',
  },
  roleTag: {
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    marginTop: 2,
  },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  lockTextCol: {
    flex: 1,
    gap: 2,
  },
  lockTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.label,
    fontWeight: '700',
  },
  lockSub: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
});
