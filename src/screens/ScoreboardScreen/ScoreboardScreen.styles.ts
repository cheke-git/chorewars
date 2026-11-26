import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: 2,
  },
  fortLabel: {
    color: Colors.brandOrange,
    fontSize: Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  leaderCardActive: {
    borderColor: Colors.brandOrange,
  },
  position: {
    color: Colors.brandOrange,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 28,
  },
  leaderMeta: {
    flex: 1,
    gap: 4,
  },
  leaderNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderName: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: '800',
  },
  leaderXp: {
    color: Colors.brandOrange,
    fontSize: Typography.body,
    fontWeight: '800',
  },
  leaderRank: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandOrange,
    borderRadius: Radius.full,
  },
  progressFillSuccess: {
    backgroundColor: Colors.success,
  },
  rewardCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rewardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rewardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: '800',
    flex: 1,
  },
  rewardGoalPill: {
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: Typography.caption,
    fontWeight: '700',
    overflow: 'hidden',
  },
  rewardMemberRow: {
    gap: 4,
  },
  rewardMemberTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardMemberName: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    fontWeight: '600',
  },
  rewardMemberStatus: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  rewardUnlockedText: {
    color: Colors.success,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.label,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  activityLeft: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.label,
    fontWeight: '600',
  },
  activityComment: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    fontStyle: 'italic',
  },
  activityXp: {
    color: Colors.success,
    fontSize: Typography.label,
    fontWeight: '800',
  },
});
