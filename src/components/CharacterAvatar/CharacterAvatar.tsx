import { Image, Text, View } from 'react-native';

import {
  getAvatarPreset,
  resolveCharacterPortrait,
} from '@/constants/characterArt';
import { getEffectiveArtTier } from '@/constants/evolutionVideos';
import { getRankInfo } from '@/constants/ranks';

import { styles } from './CharacterAvatar.styles';

interface CharacterAvatarProps {
  name: string;
  avatarKey: string;
  avatarUrl?: string | null;
  xpTotal?: number;
  claimedArtTier?: number;
  tierOverride?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'hero';
  highlighted?: boolean;
  showTierBadge?: boolean;
}

export function CharacterAvatar({
  name,
  avatarKey,
  avatarUrl,
  xpTotal = 0,
  claimedArtTier,
  tierOverride,
  size = 'md',
  variant = 'badge',
  highlighted = false,
  showTierBadge = false,
}: CharacterAvatarProps) {
  const preset = getAvatarPreset(avatarKey);
  const rank = getRankInfo(xpTotal);
  const displayTier =
    tierOverride !== undefined
      ? tierOverride
      : getEffectiveArtTier(rank.artTier, claimedArtTier);
  const portraitSource = avatarUrl
    ? { uri: avatarUrl }
    : resolveCharacterPortrait(avatarKey, displayTier);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (variant === 'hero' && portraitSource) {
    return (
      <View
        style={[
          styles.heroWrapper,
          size === 'sm' && styles.heroSm,
          size === 'md' && styles.heroMd,
          size === 'lg' && styles.heroLg,
          size === 'xl' && styles.heroXl,
        ]}>
        <View
          style={[
            styles.heroGlow,
            {
              borderColor: highlighted || displayTier > 1 ? rank.frameColor : 'rgba(255,255,255,0.12)',
            },
          ]}
        />
        <Image source={portraitSource} style={styles.heroImage} resizeMode="contain" />
        {showTierBadge ? (
          <View style={[styles.tierBadgeHero, { backgroundColor: rank.frameColor }]}>
            <Text style={styles.tierBadgeText}>T{displayTier}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  const borderColor = highlighted || displayTier > 1 ? rank.frameColor : undefined;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badgeBox,
          size === 'sm' && styles.sm,
          size === 'md' && styles.md,
          size === 'lg' && styles.lg,
          size === 'xl' && styles.xl,
          portraitSource ? styles.portraitBackdrop : { backgroundColor: preset.bgColor },
          borderColor ? { borderColor, borderWidth: 2.5 } : null,
        ]}>
        {portraitSource ? (
          <Image source={portraitSource} style={styles.badgePortrait} resizeMode="contain" />
        ) : (
          <Text
            style={[
              styles.initials,
              size === 'sm' && styles.initialsSm,
              (size === 'lg' || size === 'xl') && styles.initialsLg,
            ]}>
            {initials || preset.badge}
          </Text>
        )}
      </View>

      {showTierBadge && size !== 'sm' ? (
        <View style={[styles.tierBadge, { backgroundColor: rank.frameColor }]}>
          <Text style={styles.tierBadgeText}>T{displayTier}</Text>
        </View>
      ) : null}
    </View>
  );
}
