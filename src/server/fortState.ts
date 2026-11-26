import { and, asc, desc, eq, lt } from 'drizzle-orm';

import { areas, forts, getDb, profiles, rewards, taskRuns, tasks } from '@/db';
import type {
  ActiveRunSummary,
  AreaDTO,
  FortStateDTO,
  HomeType,
  ProfileDTO,
  ProfileRole,
  RecurrenceType,
  RewardDTO,
  RewardType,
  TaskDTO,
  TaskRunDTO,
  TaskRunStatus,
  ValidationMode,
} from '@/shared/types';

import { HttpError } from './auth';

export async function getFortByAccountId(accountId: string) {
  const db = getDb();
  const [fort] = await db
    .select()
    .from(forts)
    .where(eq(forts.ownerAccountId, accountId))
    .limit(1);
  return fort ?? null;
}

export async function requireFortByAccountId(accountId: string) {
  const fort = await getFortByAccountId(accountId);
  if (!fort) {
    throw new HttpError('No Fort found for this account. Complete setup first.', 404);
  }
  return fort;
}

function computeNextAvailableAt(
  recurrenceType: RecurrenceType,
  cooldownDays: number | null,
  lastCompleted: Date | null
): { nextAvailableAt: Date | null; isAvailable: boolean } {
  if (!lastCompleted) {
    return { nextAvailableAt: null, isAvailable: true };
  }

  const now = new Date();

  if (recurrenceType === 'one_off') {
    return { nextAvailableAt: null, isAvailable: false };
  }

  if (recurrenceType === 'daily') {
    const nextDay = new Date(lastCompleted);
    nextDay.setUTCHours(24, 0, 0, 0);
    return {
      nextAvailableAt: nextDay,
      isAvailable: now >= nextDay,
    };
  }

  const days =
    recurrenceType === 'cooldown'
      ? Math.max(1, cooldownDays ?? 3)
      : recurrenceType === 'weekly'
        ? 7
        : 30;

  const nextDate = new Date(lastCompleted.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    nextAvailableAt: nextDate,
    isAvailable: now >= nextDate,
  };
}

export async function buildFortState(fortId: string): Promise<FortStateDTO> {
  const db = getDb();
  const now = new Date();

  // Auto-release abandoned in-progress runs (anti-squatting safeguard)
  await db
    .update(taskRuns)
    .set({ status: 'expired' })
    .where(
      and(
        eq(taskRuns.fortId, fortId),
        eq(taskRuns.status, 'in_progress'),
        lt(taskRuns.expiresAt, now)
      )
    );

  const [[fort], fortProfiles, fortAreas, fortTasks, fortRuns, fortRewards] = await Promise.all([
    db.select().from(forts).where(eq(forts.id, fortId)).limit(1),
    db
      .select()
      .from(profiles)
      .where(eq(profiles.fortId, fortId))
      .orderBy(desc(profiles.xpTotal), asc(profiles.createdAt)),
    db
      .select()
      .from(areas)
      .where(eq(areas.fortId, fortId))
      .orderBy(asc(areas.sortOrder), asc(areas.createdAt)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.fortId, fortId), eq(tasks.isActive, true)))
      .orderBy(asc(tasks.createdAt)),
    db
      .select()
      .from(taskRuns)
      .where(eq(taskRuns.fortId, fortId))
      .orderBy(desc(taskRuns.startedAt))
      .limit(100),
    db
      .select()
      .from(rewards)
      .where(and(eq(rewards.fortId, fortId), eq(rewards.isActive, true)))
      .orderBy(asc(rewards.targetXp), asc(rewards.createdAt)),
  ]);

  if (!fort) {
    throw new HttpError('Fort not found.', 404);
  }

  const profileMap = new Map(fortProfiles.map((p) => [p.id, p]));
  const taskMap = new Map(fortTasks.map((t) => [t.id, t]));

  const activeRunByTask = new Map<string, ActiveRunSummary>();
  const lastCompletedByTask = new Map<string, Date>();

  for (const run of fortRuns) {
    if (run.status === 'in_progress' && !activeRunByTask.has(run.taskId)) {
      const runner = profileMap.get(run.profileId);
      activeRunByTask.set(run.taskId, {
        id: run.id,
        profileId: run.profileId,
        profileName: runner?.name ?? 'Recruit',
        startedAt: run.startedAt.toISOString(),
        expiresAt: run.expiresAt ? run.expiresAt.toISOString() : null,
      });
    }
    if (run.status === 'approved' && run.completedAt && !lastCompletedByTask.has(run.taskId)) {
      lastCompletedByTask.set(run.taskId, run.completedAt);
    }
  }

  const profileDtos: ProfileDTO[] = fortProfiles.map((p) => ({
    id: p.id,
    fortId: p.fortId,
    name: p.name,
    role: p.role as ProfileRole,
    isAdult: p.isAdult,
    avatarKey: p.avatarKey,
    avatarUrl: p.avatarUrl,
    xpTotal: p.xpTotal,
  }));

  const areaDtos: AreaDTO[] = fortAreas.map((a) => ({
    id: a.id,
    fortId: a.fortId,
    name: a.name,
    categoryKey: a.categoryKey,
    iconKey: a.iconKey,
    defaultXp: a.defaultXp,
    sortOrder: a.sortOrder,
  }));

  const taskDtos: TaskDTO[] = fortTasks.map((t) => {
    const recurrenceType = t.recurrenceType as RecurrenceType;
    const activeRun = activeRunByTask.get(t.id) ?? null;
    const lastCompleted = lastCompletedByTask.get(t.id) ?? null;
    const availability = computeNextAvailableAt(recurrenceType, t.cooldownDays, lastCompleted);

    return {
      id: t.id,
      fortId: t.fortId,
      areaId: t.areaId,
      title: t.title,
      categoryKey: t.categoryKey,
      xp: t.xp,
      recurrenceType,
      cooldownDays: t.cooldownDays,
      validationMode: t.validationMode as ValidationMode,
      assignedProfileId: t.assignedProfileId,
      isActive: t.isActive,
      activeRun,
      lastCompletedAt: lastCompleted ? lastCompleted.toISOString() : null,
      nextAvailableAt: availability.nextAvailableAt
        ? availability.nextAvailableAt.toISOString()
        : null,
      isAvailable: !activeRun && availability.isAvailable,
    };
  });

  const recentRunDtos: TaskRunDTO[] = fortRuns
    .filter((run) => run.status === 'approved')
    .slice(0, 20)
    .map((run) => ({
      id: run.id,
      taskId: run.taskId,
      taskTitle: taskMap.get(run.taskId)?.title ?? 'Mission',
      profileId: run.profileId,
      profileName: profileMap.get(run.profileId)?.name ?? 'Recruit',
      status: run.status as TaskRunStatus,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt ? run.completedAt.toISOString() : null,
      durationSeconds: run.durationSeconds,
      xpAwarded: run.xpAwarded,
      comment: run.comment,
    }));

  const rewardDtos: RewardDTO[] = fortRewards.map((r) => ({
    id: r.id,
    fortId: r.fortId,
    title: r.title,
    type: r.type as RewardType,
    targetXp: r.targetXp,
    poolAmountCents: r.poolAmountCents,
    excludedProfileIds: Array.isArray(r.excludedProfileIds) ? r.excludedProfileIds : [],
    isActive: r.isActive,
  }));

  return {
    fort: {
      id: fort.id,
      name: fort.name,
      homeType: fort.homeType as HomeType,
      bedroomCount: fort.bedroomCount,
      bathroomCount: fort.bathroomCount,
      hasKitchen: fort.hasKitchen,
      hasYard: fort.hasYard,
      hasPets: fort.hasPets,
    },
    profiles: profileDtos,
    areas: areaDtos,
    tasks: taskDtos,
    recentRuns: recentRunDtos,
    rewards: rewardDtos,
  };
}
