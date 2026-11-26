import { StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';

export const styles = StyleSheet.create({
  image: {
    width: 78,
    height: 78,
  },
  imageSm: {
    width: 44,
    height: 44,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderSm: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
  },
  symbol: {
    fontSize: 30,
  },
  symbolSm: {
    fontSize: 20,
  },
});
