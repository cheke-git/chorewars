import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  toastSuccess: {
    backgroundColor: 'rgba(6, 30, 32, 0.96)',
    borderColor: Colors.success,
  },
  toastError: {
    backgroundColor: 'rgba(46, 10, 20, 0.97)',
    borderColor: Colors.error,
  },
  message: {
    flex: 1,
    fontSize: Typography.label,
    fontWeight: '700',
    lineHeight: 19,
  },
  messageSuccess: {
    color: '#86EFAC',
  },
  messageError: {
    color: '#FCA5A5',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
