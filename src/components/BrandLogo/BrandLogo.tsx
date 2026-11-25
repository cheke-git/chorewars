import { Image } from 'react-native';

import { styles } from './BrandLogo.styles';

const logoSource = require('@/assets/images/cw-logo-splash.png');

export function BrandLogo() {
  return (
    <Image
      source={logoSource}
      style={styles.logo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Chore Wars logo"
    />
  );
}
