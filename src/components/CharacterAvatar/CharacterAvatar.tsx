import { Image, Text, View } from 'react-native';

import {
  getAvatarPreset,
  resolveCharacterPortrait,
} from '@/constants/characterArt';
import { getRankInfo } from '@/constants/ranks';

import { styles } from './CharacterAvatar.styles';

interface CharacterAvatarProps {
  name: string;
  avatarKey: string;
  avatarUrl?: string | null;
  xpTotal?: number;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  showTierBadge?: boolean;
}

export function CharacterAvatar({
  name,
  avatarKey,
  avatarUrl,
  xpTotal = 0,
  size = 'md',
  highlighted = false,
  showTierBadge = false,
}: CharacterAvatarProps) {
  const preset = getAvatarPreset(avatarKey);
  const rank = getRankInfo(xpTotal);
  const portraitSource = avatarUrl
    ? { uri: avatarUrl }
    : resolveCharacterPortrait(avatarKey, rank.artTier);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const borderColor = highlighted ? rank.frameColor : rank.artTier > 1 ? rank.frameColor : undefined;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          size === 'sm' && styles.sm,
          size === 'md' && styles.md,
          size === 'lg' && styles.lg,
          portraitSource ? styles.portraitBackdrop : { backgroundColor: preset.bgColor },
          borderColor ? { borderColor, borderWidth: highlighted || rank.artTier > 1 ? 3 : 2 } : null,
        ]}>
        {portraitSource ? (
          <Image source={portraitSource} style={styles.portrait} resizeMode="contain" />
        ) : (
          <Text
            style={[
              styles.initials,
              size === 'sm' && styles.initialsSm,
              size === 'lg' && styles.initialsLg,
            ]}>
            {initials || preset.badge}
          </Text>
        )}
      </View>

      {showTierBadge && size !== 'sm' ? (
        <View style={[styles.tierBadge, { backgroundColor: rank.frameColor }]}>
          <Text style={styles.tierBadgeText}>T{rank.artTier}</Text>
        </View>
      ) : null}
    </View>
  );
}
