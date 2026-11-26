import type { ReactNode } from 'react';
import { ImageBackground, View } from 'react-native';

import { styles } from './FortBackground.styles';

const patternSource = require('@/assets/images/bg-pattern.png');

interface FortBackgroundProps {
  children: ReactNode;
}

export function FortBackground({ children }: FortBackgroundProps) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={patternSource}
        resizeMode="repeat"
        style={styles.pattern}
        imageStyle={styles.patternImage}>
        {children}
      </ImageBackground>
    </View>
  );
}
