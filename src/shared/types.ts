export type HomeType = 'house' | 'apartment' | 'studio';
export type ProfileRole = 'coch' | 'reviewer' | 'recruit';
export type RecurrenceType = 'daily' | 'cooldown' | 'weekly' | 'monthly' | 'one_off';
export type ValidationMode = 'honor' | 'photo';
export type TaskRunStatus = 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'expired';
export type RewardType = 'individual_goal' | 'bounty_pool';

export interface AccountDTO {
  id: string;
  email: string;
}

export interface FortDTO {
  id: string;
  name: string;
  homeType: HomeType;
  bedroomCount: number;
  bathroomCount: number;
  hasKitchen: boolean;
  hasYard: boolean;
  hasPets: boolean;
}

export interface ProfileDTO {
  id: string;
  fortId: string;
  name: string;
  role: ProfileRole;
  isAdult: boolean;
  avatarKey: string;
  avatarUrl: string | null;
  xpTotal: number;
}

export interface AreaDTO {
  id: string;
  fortId: string;
  name: string;
  categoryKey: string;
  iconKey: string;
  defaultXp: number;
  sortOrder: number;
}

export interface ActiveRunSummary {
  id: string;
  profileId: string;
  profileName: string;
  startedAt: string;
  expiresAt: string | null;
}

export interface TaskDTO {
  id: string;
  fortId: string;
  areaId: string | null;
  title: string;
  categoryKey: string;
  xp: number;
  recurrenceType: RecurrenceType;
  cooldownDays: number | null;
  validationMode: ValidationMode;
  assignedProfileId: string | null;
  isActive: boolean;
  activeRun: ActiveRunSummary | null;
  lastCompletedAt: string | null;
  nextAvailableAt: string | null;
  isAvailable: boolean;
}

export interface TaskRunDTO {
  id: string;
  taskId: string;
  taskTitle: string;
  profileId: string;
  profileName: string;
  status: TaskRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  xpAwarded: number;
  comment: string | null;
}

export interface RewardDTO {
  id: string;
  fortId: string;
  title: string | null;
  type: RewardType;
  targetXp: number;
  poolAmountCents: number | null;
  excludedProfileIds: string[];
  isActive: boolean;
}

export interface FortStateDTO {
  fort: FortDTO;
  profiles: ProfileDTO[];
  areas: AreaDTO[];
  tasks: TaskDTO[];
  recentRuns: TaskRunDTO[];
  rewards: RewardDTO[];
}

export interface AvatarPreset {
  key: string;
  label: string;
  badge: string;
  bgColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: 'commander-orange', label: 'Commander', badge: 'CM', bgColor: '#FF5A00' },
  { key: 'broom-knight', label: 'Broom Knight', badge: 'BK', bgColor: '#2563EB' },
  { key: 'dish-ninja', label: 'Dish Ninja', badge: 'DN', bgColor: '#7C3AED' },
  { key: 'sparkle-wizard', label: 'Sparkle Mage', badge: 'SM', bgColor: '#0D9488' },
  { key: 'trash-titan', label: 'Trash Titan', badge: 'TT', bgColor: '#D97706' },
  { key: 'star-scout', label: 'Star Scout', badge: 'SS', bgColor: '#DB2777' },
];

export function getAvatarPreset(key: string): AvatarPreset {
  return AVATAR_PRESETS.find((preset) => preset.key === key) ?? AVATAR_PRESETS[0];
}

export interface RankInfo {
  title: string;
  minXp: number;
  nextTitle: string | null;
  nextXp: number | null;
  progress: number;
}

const RANK_TIERS = [
  { title: 'Recruit', minXp: 0 },
  { title: 'Scout', minXp: 30 },
  { title: 'Corporal', minXp: 80 },
  { title: 'Captain', minXp: 160 },
  { title: 'Commander', minXp: 300 },
  { title: 'Fort Legend', minXp: 500 },
] as const;

export function getRankInfo(xp: number): RankInfo {
  let currentIndex = 0;
  for (let i = 0; i < RANK_TIERS.length; i += 1) {
    if (xp >= RANK_TIERS[i].minXp) {
      currentIndex = i;
    }
  }

  const current = RANK_TIERS[currentIndex];
  const next = RANK_TIERS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      title: current.title,
      minXp: current.minXp,
      nextTitle: null,
      nextXp: null,
      progress: 1,
    };
  }

  const span = next.minXp - current.minXp;
  const progress = Math.max(0, Math.min(1, (xp - current.minXp) / span));

  return {
    title: current.title,
    minXp: current.minXp,
    nextTitle: next.title,
    nextXp: next.minXp,
    progress,
  };
}

export function formatRecurrence(
  recurrenceType: RecurrenceType,
  cooldownDays: number | null
): string {
  switch (recurrenceType) {
    case 'daily':
      return 'Daily';
    case 'cooldown':
      return `Every ${cooldownDays ?? 3}d`;
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'one_off':
      return 'One-Off';
    default:
      return 'Daily';
  }
}
