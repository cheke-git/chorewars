import type { ImageSourcePropType } from 'react-native';

export interface TaskArtMeta {
  symbol: string;
  accentBg: string;
  accentBorder: string;
  image?: ImageSourcePropType;
}

export const TASK_ART_MAP: Record<string, TaskArtMeta> = {
  dishes: {
    symbol: '🍽',
    accentBg: 'rgba(56, 189, 248, 0.16)',
    accentBorder: 'rgba(56, 189, 248, 0.45)',
    image: require('@/assets/images/tasks/dishes.png'),
  },
  counter_wipe: {
    symbol: '🧽',
    accentBg: 'rgba(250, 204, 21, 0.16)',
    accentBorder: 'rgba(250, 204, 21, 0.45)',
    image: require('@/assets/images/tasks/counter_wipe.png'),
  },
  floor_sweep: {
    symbol: '🧹',
    accentBg: 'rgba(255, 90, 0, 0.18)',
    accentBorder: 'rgba(255, 90, 0, 0.5)',
    image: require('@/assets/images/tasks/floor_sweep.png'),
  },
  tidy_room: {
    symbol: '🛋',
    accentBg: 'rgba(168, 85, 247, 0.16)',
    accentBorder: 'rgba(168, 85, 247, 0.45)',
    image: require('@/assets/images/tasks/tidy_room.png'),
  },
  vacuum: {
    symbol: '🌪',
    accentBg: 'rgba(99, 102, 241, 0.18)',
    accentBorder: 'rgba(99, 102, 241, 0.5)',
    image: require('@/assets/images/tasks/vacuum.png'),
  },
  sink_mirror: {
    symbol: '✨',
    accentBg: 'rgba(45, 212, 191, 0.16)',
    accentBorder: 'rgba(45, 212, 191, 0.45)',
    image: require('@/assets/images/tasks/sink_mirror.png'),
  },
  toilet_scrub: {
    symbol: '🫧',
    accentBg: 'rgba(59, 130, 246, 0.18)',
    accentBorder: 'rgba(59, 130, 246, 0.5)',
    image: require('@/assets/images/tasks/toilet_scrub.png'),
  },
  make_bed: {
    symbol: '🛏',
    accentBg: 'rgba(236, 72, 153, 0.16)',
    accentBorder: 'rgba(236, 72, 153, 0.45)',
    image: require('@/assets/images/tasks/make_bed.png'),
  },
  laundry: {
    symbol: '👕',
    accentBg: 'rgba(139, 92, 246, 0.16)',
    accentBorder: 'rgba(139, 92, 246, 0.45)',
    image: require('@/assets/images/tasks/laundry.png'),
  },
  yard_care: {
    symbol: '🌿',
    accentBg: 'rgba(34, 197, 94, 0.16)',
    accentBorder: 'rgba(34, 197, 94, 0.45)',
    image: require('@/assets/images/tasks/yard_care.png'),
  },
  trash: {
    symbol: '🗑',
    accentBg: 'rgba(249, 115, 22, 0.18)',
    accentBorder: 'rgba(249, 115, 22, 0.5)',
    image: require('@/assets/images/tasks/trash.png'),
  },
  pet_care: {
    symbol: '🐾',
    accentBg: 'rgba(245, 158, 11, 0.18)',
    accentBorder: 'rgba(245, 158, 11, 0.5)',
    image: require('@/assets/images/tasks/pet_care.png'),
  },
  custom: {
    symbol: '⚔',
    accentBg: 'rgba(255, 90, 0, 0.16)',
    accentBorder: 'rgba(255, 90, 0, 0.45)',
    image: require('@/assets/images/tasks/custom.png'),
  },
};

export function getTaskArt(categoryKey: string): TaskArtMeta {
  return TASK_ART_MAP[categoryKey] ?? TASK_ART_MAP.custom;
}
