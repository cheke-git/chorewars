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

export {
  AVATAR_PRESETS,
  getAvatarPreset,
  normalizeAvatarKey,
  resolveCharacterPortrait,
  type CharacterArchetypeKey,
  type CharacterPreset,
} from '@/constants/characterArt';
export {
  RANK_LADDER,
  getRankInfo,
  type RankDefinition,
  type RankInfo,
} from '@/constants/ranks';

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
