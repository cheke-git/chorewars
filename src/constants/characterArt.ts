import type { ImageSourcePropType } from 'react-native';

export type CharacterArchetypeKey =
  | 'parent-female'
  | 'parent-male'
  | 'kid-female'
  | 'kid-male';

export interface CharacterPreset {
  key: CharacterArchetypeKey;
  label: string;
  shortLabel: string;
  badge: string;
  bgColor: string;
  defaultIsAdult: boolean;
  /**
   * Drop promoted PNGs from `chorewars-art` into
   * `assets/images/characters/{archetype}-t{1|2|3}.png` and wire them here.
   * Adding `4`, `5`, etc. later requires zero DB or UI changes.
   */
  tiers: Partial<Record<number, ImageSourcePropType>>;
}

export const AVATAR_PRESETS: CharacterPreset[] = [
  {
    key: 'parent-female',
    label: 'Parent (Female)',
    shortLabel: 'Mom / Lead',
    badge: 'PF',
    bgColor: '#FF5A00',
    defaultIsAdult: true,
    tiers: {},
  },
  {
    key: 'parent-male',
    label: 'Parent (Male)',
    shortLabel: 'Dad / Lead',
    badge: 'PM',
    bgColor: '#2563EB',
    defaultIsAdult: true,
    tiers: {},
  },
  {
    key: 'kid-female',
    label: 'Kid (Female)',
    shortLabel: 'Girl Hero',
    badge: 'KF',
    bgColor: '#DB2777',
    defaultIsAdult: false,
    tiers: {},
  },
  {
    key: 'kid-male',
    label: 'Kid (Male)',
    shortLabel: 'Boy Hero',
    badge: 'KM',
    bgColor: '#0D9488',
    defaultIsAdult: false,
    tiers: {},
  },
];

// Graceful mapping for Phase 1 profiles created before the 4 core archetypes
const LEGACY_AVATAR_MAP: Record<string, CharacterArchetypeKey> = {
  'commander-orange': 'parent-male',
  'broom-knight': 'kid-male',
  'dish-ninja': 'kid-female',
  'sparkle-wizard': 'parent-female',
  'trash-titan': 'kid-male',
  'star-scout': 'kid-female',
};

export function normalizeAvatarKey(key: string): CharacterArchetypeKey {
  const direct = AVATAR_PRESETS.find((preset) => preset.key === key);
  if (direct) {
    return direct.key;
  }
  return LEGACY_AVATAR_MAP[key] ?? 'parent-male';
}

export function getAvatarPreset(key: string): CharacterPreset {
  const normalized = normalizeAvatarKey(key);
  return AVATAR_PRESETS.find((preset) => preset.key === normalized) ?? AVATAR_PRESETS[0];
}

/**
 * Resolves the highest available promoted portrait at or below `artTier`.
 */
export function resolveCharacterPortrait(
  avatarKey: string,
  artTier: number
): ImageSourcePropType | null {
  const preset = getAvatarPreset(avatarKey);
  const availableTiers = Object.keys(preset.tiers)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n <= artTier && Boolean(preset.tiers[n]))
    .sort((a, b) => b - a);

  const chosenTier = availableTiers[0];
  if (chosenTier === undefined) {
    return null;
  }
  return preset.tiers[chosenTier] ?? null;
}
