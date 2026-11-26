import { Text, View } from 'react-native';

import { getAvatarPreset } from '@/shared/types';

import { styles } from './CharacterAvatar.styles';

interface CharacterAvatarProps {
  name: string;
  avatarKey: string;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

export function CharacterAvatar({
  name,
  avatarKey,
  size = 'md',
  highlighted = false,
}: CharacterAvatarProps) {
  const preset = getAvatarPreset(avatarKey);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.circle,
        size === 'sm' && styles.sm,
        size === 'md' && styles.md,
        size === 'lg' && styles.lg,
        { backgroundColor: preset.bgColor },
        highlighted && styles.highlighted,
      ]}>
      <Text
        style={[
          styles.initials,
          size === 'sm' && styles.initialsSm,
          size === 'lg' && styles.initialsLg,
        ]}>
        {initials || preset.badge}
      </Text>
    </View>
  );
}
