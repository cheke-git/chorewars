import type { ImageSourcePropType } from 'react-native';

export interface TaskArtMeta {
  symbol: string;
  accentBg: string;
  accentBorder: string;
  /**
   * Drop promoted PNGs into `assets/images/tasks/<key>.png` from `chorewars-art`
   * and wire `require('@/assets/images/tasks/<key>.png')` here.
   */
  image?: ImageSourcePropType;
}

export const TASK_ART_MAP: Record<string, TaskArtMeta> = {
  dishes: {
    symbol: '🍽',
    accentBg: 'rgba(56, 189, 248, 0.16)',
    accentBorder: 'rgba(56, 189, 248, 0.45)',
  },
  counter_wipe: {
    symbol: '🧽',
    accentBg: 'rgba(250, 204, 21, 0.16)',
    accentBorder: 'rgba(250, 204, 21, 0.45)',
  },
  floor_sweep: {
    symbol: '🧹',
    accentBg: 'rgba(255, 90, 0, 0.18)',
    accentBorder: 'rgba(255, 90, 0, 0.5)',
  },
  tidy_room: {
    symbol: '🛋',
    accentBg: 'rgba(168, 85, 247, 0.16)',
    accentBorder: 'rgba(168, 85, 247, 0.45)',
  },
  vacuum: {
    symbol: '🌪',
    accentBg: 'rgba(99, 102, 241, 0.18)',
    accentBorder: 'rgba(99, 102, 241, 0.5)',
  },
  sink_mirror: {
    symbol: '✨',
    accentBg: 'rgba(45, 212, 191, 0.16)',
    accentBorder: 'rgba(45, 212, 191, 0.45)',
  },
  toilet_scrub: {
    symbol: '🫧',
    accentBg: 'rgba(59, 130, 246, 0.18)',
    accentBorder: 'rgba(59, 130, 246, 0.5)',
  },
  make_bed: {
    symbol: '🛏',
    accentBg: 'rgba(236, 72, 153, 0.16)',
    accentBorder: 'rgba(236, 72, 153, 0.45)',
  },
  laundry: {
    symbol: '👕',
    accentBg: 'rgba(139, 92, 246, 0.16)',
    accentBorder: 'rgba(139, 92, 246, 0.45)',
  },
  yard_care: {
    symbol: '🌿',
    accentBg: 'rgba(34, 197, 94, 0.16)',
    accentBorder: 'rgba(34, 197, 94, 0.45)',
  },
  trash: {
    symbol: '🗑',
    accentBg: 'rgba(249, 115, 22, 0.18)',
    accentBorder: 'rgba(249, 115, 22, 0.5)',
  },
  pet_care: {
    symbol: '🐾',
    accentBg: 'rgba(245, 158, 11, 0.18)',
    accentBorder: 'rgba(245, 158, 11, 0.5)',
  },
  custom: {
    symbol: '⚔',
    accentBg: 'rgba(255, 90, 0, 0.16)',
    accentBorder: 'rgba(255, 90, 0, 0.45)',
  },
};

export function getTaskArt(categoryKey: string): TaskArtMeta {
  return TASK_ART_MAP[categoryKey] ?? TASK_ART_MAP.custom;
}
