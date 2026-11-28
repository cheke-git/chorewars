import type { VideoSource } from 'expo-video';

import {
  normalizeAvatarKey,
  type CharacterArchetypeKey,
} from '@/constants/characterArt';

/**
 * Single-source resolver for character tier evolution videos.
 * Currently bundled as mobile-optimized 720x1280 H.264 MP4s (~1 MB each).
 * To move to Cloudflare R2 later, replace the require() map with CDN URLs.
 */
const EVOLUTION_VIDEO_MAP: Record<
  CharacterArchetypeKey,
  Partial<Record<'1-2' | '2-3', VideoSource>>
> = {
  'parent-female': {
    '1-2': require('@/assets/videos/evolutions/parent-female-t1-to-t2.mp4'),
    '2-3': require('@/assets/videos/evolutions/parent-female-t2-to-t3.mp4'),
  },
  'parent-male': {
    '1-2': require('@/assets/videos/evolutions/parent-male-t1-to-t2.mp4'),
    '2-3': require('@/assets/videos/evolutions/parent-male-t2-to-t3.mp4'),
  },
  'kid-female': {
    '1-2': require('@/assets/videos/evolutions/kid-female-t1-to-t2.mp4'),
    '2-3': require('@/assets/videos/evolutions/kid-female-t2-to-t3.mp4'),
  },
  'kid-male': {
    '1-2': require('@/assets/videos/evolutions/kid-male-t1-to-t2.mp4'),
    '2-3': require('@/assets/videos/evolutions/kid-male-t2-to-t3.mp4'),
  },
};

export function resolveEvolutionVideo(
  avatarKey: string,
  fromTier: number,
  toTier: number
): VideoSource | null {
  const archetype = normalizeAvatarKey(avatarKey);
  const transitionKey = `${fromTier}-${toTier}` as '1-2' | '2-3';
  return EVOLUTION_VIDEO_MAP[archetype]?.[transitionKey] ?? null;
}

export function getEffectiveArtTier(earnedArtTier: number, claimedArtTier?: number): number {
  if (claimedArtTier === undefined) {
    return earnedArtTier;
  }
  return Math.max(1, Math.min(earnedArtTier, claimedArtTier));
}
