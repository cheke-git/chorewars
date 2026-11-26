import { Image, Text, View } from 'react-native';

import { getTaskArt } from '@/constants/taskArt';

import { styles } from './TaskArtBadge.styles';

interface TaskArtBadgeProps {
  categoryKey: string;
  size?: 'sm' | 'md';
}

export function TaskArtBadge({ categoryKey, size = 'md' }: TaskArtBadgeProps) {
  const art = getTaskArt(categoryKey);

  if (art.image) {
    return (
      <Image
        source={art.image}
        style={[styles.image, size === 'sm' && styles.imageSm]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        size === 'sm' && styles.placeholderSm,
        { backgroundColor: art.accentBg, borderColor: art.accentBorder },
      ]}>
      <Text style={[styles.symbol, size === 'sm' && styles.symbolSm]}>{art.symbol}</Text>
    </View>
  );
}
