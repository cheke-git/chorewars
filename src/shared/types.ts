export type HomeType = 'house' | 'apartment' | 'studio';
export type MembershipRole = 'coch' | 'reviewer' | 'recruit';
export type ProfileRole = MembershipRole;
export type RecurrenceType = 'daily' | 'cooldown' | 'weekly' | 'monthly' | 'one_off' | 'on_demand';
export type ValidationMode = 'honor' | 'photo';
export type TaskRunStatus =
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'undone';
export type RewardType = 'individual_goal' | 'bounty_pool';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface UserDTO {
  id: string;
  email: string | null;
  guardianUserId: string | null;
  isSupervised: boolean;
  hasGuardianPin: boolean;
  name: string;
  isAdult: boolean;
  avatarKey: string;
  avatarUrl: string | null;
  careerXp: number;
  claimedArtTier: number;
}

export interface FortSummaryDTO {
  id: string;
  name: string;
  homeType: HomeType;
  role: MembershipRole;
  fortXp: number;
  memberUserIds: string[];
}

export interface SupervisedFortMembershipDTO {
  membershipId: string;
  fortId: string;
  fortName: string;
  role: MembershipRole;
  fortXp: number;
}

export interface SupervisedUserDTO extends UserDTO {
  forts: SupervisedFortMembershipDTO[];
}

export interface InvitationDTO {
  id: string;
  fortId: string;
  fortName: string;
  invitedByName: string;
  targetEmail: string;
  role: MembershipRole;
  note: string | null;
  status: InvitationStatus;
  createdAt: string;
}

export interface SessionPayloadDTO {
  user: UserDTO;
  supervisedUsers: SupervisedUserDTO[];
  forts: FortSummaryDTO[];
  pendingInvitations: InvitationDTO[];
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
  inviteCode: string;
}

export interface FortMemberDTO {
  membershipId: string;
  id: string; // user.id
  fortId: string;
  name: string;
  role: MembershipRole;
  isAdult: boolean;
  isSupervised: boolean;
  guardianUserId: string | null;
  avatarKey: string;
  avatarUrl: string | null;
  careerXp: number;
  claimedArtTier: number;
  fortXp: number;
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
  userId: string;
  userName: string;
  startedAt: string;
  expiresAt: string | null;
}

export interface LastCompletedRunSummary {
  id: string;
  userId: string;
  userName: string;
  completedAt: string;
  xpAwarded: number;
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
  assignedUserId: string | null;
  isActive: boolean;
  activeRun: ActiveRunSummary | null;
  lastCompletedRun: LastCompletedRunSummary | null;
  lastCompletedAt: string | null;
  nextAvailableAt: string | null;
  isAvailable: boolean;
}

export interface TaskRunDTO {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
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
  excludedUserIds: string[];
  isActive: boolean;
}

export interface FortStateDTO {
  fort: FortDTO;
  members: FortMemberDTO[];
  areas: AreaDTO[];
  tasks: TaskDTO[];
  recentRuns: TaskRunDTO[];
  rewards: RewardDTO[];
  invitations: InvitationDTO[];
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
    case 'on_demand':
      return 'Anytime';
    default:
      return 'Daily';
  }
}
