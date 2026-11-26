import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pattern: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  patternImage: {
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
});
