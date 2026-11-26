import { StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';

export const styles = StyleSheet.create({
  image: {
    width: 96,
    height: 96,
  },
  imageSm: {
    width: 72,
    height: 72,
  },
  imageHero: {
    width: 148,
    height: 148,
  },
  placeholder: {
    width: 82,
    height: 82,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderSm: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  placeholderHero: {
    width: 100,
    height: 100,
    borderRadius: Radius.lg,
  },
  symbol: {
    fontSize: 34,
  },
  symbolSm: {
    fontSize: 24,
  },
  symbolHero: {
    fontSize: 44,
  },
});
