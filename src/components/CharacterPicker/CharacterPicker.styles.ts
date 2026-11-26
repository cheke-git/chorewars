import { StyleSheet } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 96,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: Colors.brandOrange,
    backgroundColor: Colors.surfaceElevated,
  },
  portrait: {
    width: '112%',
    height: '112%',
  },
});
