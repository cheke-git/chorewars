import { and, asc, desc, eq, inArray, isNull, lt } from 'drizzle-orm';

import {
  areas,
  fortInvitations,
  fortMemberships,
  forts,
  getDb,
  rewards,
  taskRuns,
  tasks,
  users,
} from '@/db';
import type {
  ActiveRunSummary,
  AreaDTO,
  FortMemberDTO,
  FortStateDTO,
  FortSummaryDTO,
  HomeType,
  InvitationDTO,
  InvitationStatus,
  LastCompletedRunSummary,
  MembershipRole,
  RecurrenceType,
  RewardDTO,
  RewardType,
  SessionPayloadDTO,
  SupervisedUserDTO,
  TaskDTO,
  TaskRunDTO,
  TaskRunStatus,
  UserDTO,
  ValidationMode,
} from '@/shared/types';

import { HttpError } from './auth';

export function toUserDTO(u: typeof users.$inferSelect): UserDTO {
  return {
    id: u.id,
    email: u.email,
    guardianUserId: u.guardianUserId,
    isSupervised: Boolean(u.guardianUserId),
    hasGuardianPin: Boolean(u.guardianPinHash),
    name: u.name,
    isAdult: u.isAdult,
    avatarKey: u.avatarKey,
    avatarUrl: u.avatarUrl,
    careerXp: u.careerXp,
  };
}

export async function assertActingUserAuthorized(
  sessionUserId: string,
  actingUserId: string
): Promise<typeof users.$inferSelect> {
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, actingUserId)).limit(1);
  if (!target) {
    throw new HttpError('User profile not found.', 404);
  }
  if (target.id !== sessionUserId && target.guardianUserId !== sessionUserId) {
    throw new HttpError('You are not authorized to act for this user.', 403);
  }
  return target;
}

export async function requireFortMembership(fortId: string, userId: string) {
  const db = getDb();
  const [membership] = await db
    .select()
    .from(fortMemberships)
    .where(
      and(
        eq(fortMemberships.fortId, fortId),
        eq(fortMemberships.userId, userId),
        isNull(fortMemberships.leftAt)
      )
    )
    .limit(1);

  if (!membership) {
    throw new HttpError('User is not an active member of this Fort.', 403);
  }
  return membership;
}

export async function requireFortAccessForSession(fortId: string, sessionUserId: string) {
  const db = getDb();
  const familyUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.guardianUserId, sessionUserId));

  const allowedUserIds = [sessionUserId, ...familyUsers.map((u) => u.id)];
  const [membership] = await db
    .select()
    .from(fortMemberships)
    .where(
      and(
        eq(fortMemberships.fortId, fortId),
        inArray(fortMemberships.userId, allowedUserIds),
        isNull(fortMemberships.leftAt)
      )
    )
    .limit(1);

  if (!membership) {
    throw new HttpError('You do not have access to this Fort.', 403);
  }
  return membership;
}

export async function requireFortCoch(fortId: string, sessionUserId: string) {
  const membership = await requireFortMembership(fortId, sessionUserId);
  if (membership.role !== 'coch') {
    throw new HttpError('Commander in Chief (CoCh) permissions required for this Fort.', 403);
  }
  return membership;
}

export async function ensureActiveMembership(
  fortId: string,
  userId: string,
  role: MembershipRole
): Promise<void> {
  const db = getDb();

  // Only full accounts can be CoCh
  if (role === 'coch') {
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target || target.guardianUserId) {
      throw new HttpError('Only full accounts can be a Commander in Chief (CoCh).', 400);
    }
  }

  const [existing] = await db
    .select()
    .from(fortMemberships)
    .where(and(eq(fortMemberships.fortId, fortId), eq(fortMemberships.userId, userId)))
    .limit(1);

  if (existing) {
    await db
      .update(fortMemberships)
      .set({
        role,
        leftAt: null,
      })
      .where(eq(fortMemberships.id, existing.id));
  } else {
    await db.insert(fortMemberships).values({
      fortId,
      userId,
      role,
    });
  }
}

export async function buildSessionPayload(sessionUserId: string): Promise<SessionPayloadDTO> {
  const db = getDb();

  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!currentUser) {
    throw new HttpError('Account not found.', 404);
  }

  const supervisedRows = await db
    .select()
    .from(users)
    .where(eq(users.guardianUserId, sessionUserId))
    .orderBy(asc(users.createdAt));

  const allUserIds = [currentUser.id, ...supervisedRows.map((u) => u.id)];

  const activeMemberships = await db
    .select()
    .from(fortMemberships)
    .where(and(inArray(fortMemberships.userId, allUserIds), isNull(fortMemberships.leftAt)));

  const uniqueFortIds = [...new Set(activeMemberships.map((m) => m.fortId))];

  const fortRows =
    uniqueFortIds.length > 0
      ? await db
          .select()
          .from(forts)
          .where(and(inArray(forts.id, uniqueFortIds), eq(forts.isArchived, false)))
          .orderBy(asc(forts.createdAt))
      : [];

  const fortById = new Map(fortRows.map((f) => [f.id, f]));

  const fortSummaries: FortSummaryDTO[] = fortRows.map((fort) => {
    const forThisFort = activeMemberships.filter((m) => m.fortId === fort.id);
    const myMembership = forThisFort.find((m) => m.userId === currentUser.id);
    const fallbackMembership = forThisFort[0];
    return {
      id: fort.id,
      name: fort.name,
      homeType: fort.homeType as HomeType,
      role: (myMembership?.role ?? fallbackMembership?.role ?? 'recruit') as MembershipRole,
      fortXp: myMembership?.fortXp ?? fallbackMembership?.fortXp ?? 0,
      memberUserIds: forThisFort.map((m) => m.userId),
    };
  });

  const supervisedUsers: SupervisedUserDTO[] = supervisedRows.map((kid) => {
    const kidMemberships = activeMemberships
      .filter((m) => m.userId === kid.id && fortById.has(m.fortId))
      .map((m) => ({
        membershipId: m.id,
        fortId: m.fortId,
        fortName: fortById.get(m.fortId)?.name ?? 'Fort',
        role: m.role as MembershipRole,
        fortXp: m.fortXp,
      }));

    return {
      ...toUserDTO(kid),
      forts: kidMemberships,
    };
  });

  const pendingInviteRows = currentUser.email
    ? await db
        .select()
        .from(fortInvitations)
        .where(
          and(
            eq(fortInvitations.targetEmail, currentUser.email.toLowerCase()),
            eq(fortInvitations.status, 'pending')
          )
        )
        .orderBy(desc(fortInvitations.createdAt))
    : [];

  let pendingInvitations: InvitationDTO[] = [];
  if (pendingInviteRows.length > 0) {
    const inviteFortIds = [...new Set(pendingInviteRows.map((i) => i.fortId))];
    const inviterIds = [...new Set(pendingInviteRows.map((i) => i.invitedByUserId))];

    const [inviteForts, inviters] = await Promise.all([
      db.select().from(forts).where(inArray(forts.id, inviteFortIds)),
      db.select().from(users).where(inArray(users.id, inviterIds)),
    ]);

    const inviteFortMap = new Map(inviteForts.map((f) => [f.id, f.name]));
    const inviterMap = new Map(inviters.map((u) => [u.id, u.name]));

    pendingInvitations = pendingInviteRows.map((inv) => ({
      id: inv.id,
      fortId: inv.fortId,
      fortName: inviteFortMap.get(inv.fortId) ?? 'Fort',
      invitedByName: inviterMap.get(inv.invitedByUserId) ?? 'Commander',
      targetEmail: inv.targetEmail,
      role: inv.role as MembershipRole,
      note: inv.note,
      status: inv.status as InvitationStatus,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  return {
    user: toUserDTO(currentUser),
    supervisedUsers,
    forts: fortSummaries,
    pendingInvitations,
  };
}

export function computeNextAvailableAt(
  recurrenceType: RecurrenceType,
  cooldownDays: number | null,
  lastCompleted: Date | null
): { nextAvailableAt: Date | null; isAvailable: boolean } {
  if (recurrenceType === 'on_demand') {
    return { nextAvailableAt: null, isAvailable: true };
  }

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

  // Auto-release abandoned in-progress runs (90-min anti-squatting safeguard)
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

  const [
    [fort],
    membershipRows,
    fortAreas,
    fortTasks,
    fortRuns,
    fortRewards,
    pendingInvites,
  ] = await Promise.all([
    db.select().from(forts).where(eq(forts.id, fortId)).limit(1),
    db
      .select()
      .from(fortMemberships)
      .where(and(eq(fortMemberships.fortId, fortId), isNull(fortMemberships.leftAt)))
      .orderBy(desc(fortMemberships.fortXp), asc(fortMemberships.joinedAt)),
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
      .limit(120),
    db
      .select()
      .from(rewards)
      .where(and(eq(rewards.fortId, fortId), eq(rewards.isActive, true)))
      .orderBy(asc(rewards.targetXp), asc(rewards.createdAt)),
    db
      .select()
      .from(fortInvitations)
      .where(and(eq(fortInvitations.fortId, fortId), eq(fortInvitations.status, 'pending')))
      .orderBy(desc(fortInvitations.createdAt)),
  ]);

  if (!fort || fort.isArchived) {
    throw new HttpError('Fort not found.', 404);
  }

  const neededUserIds = [
    ...new Set([
      ...membershipRows.map((m) => m.userId),
      ...fortRuns.map((r) => r.userId),
      ...pendingInvites.map((i) => i.invitedByUserId),
    ]),
  ];

  const userRows =
    neededUserIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, neededUserIds))
      : [];

  const userMap = new Map(userRows.map((u) => [u.id, u]));
  const taskMap = new Map(fortTasks.map((t) => [t.id, t]));

  const members: FortMemberDTO[] = membershipRows
    .map((m) => {
      const u = userMap.get(m.userId);
      if (!u) return null;
      return {
        membershipId: m.id,
        id: u.id,
        fortId: m.fortId,
        name: u.name,
        role: m.role as MembershipRole,
        isAdult: u.isAdult,
        isSupervised: Boolean(u.guardianUserId),
        guardianUserId: u.guardianUserId,
        avatarKey: u.avatarKey,
        avatarUrl: u.avatarUrl,
        careerXp: u.careerXp,
        fortXp: m.fortXp,
      };
    })
    .filter((item): item is FortMemberDTO => item !== null);

  const activeRunByTask = new Map<string, ActiveRunSummary>();
  const lastCompletedByTask = new Map<string, { date: Date; summary: LastCompletedRunSummary }>();

  for (const run of fortRuns) {
    if (run.status === 'in_progress' && !activeRunByTask.has(run.taskId)) {
      const runner = userMap.get(run.userId);
      activeRunByTask.set(run.taskId, {
        id: run.id,
        userId: run.userId,
        userName: runner?.name ?? 'Recruit',
        startedAt: run.startedAt.toISOString(),
        expiresAt: run.expiresAt ? run.expiresAt.toISOString() : null,
      });
    }
    if (run.status === 'approved' && run.completedAt && !lastCompletedByTask.has(run.taskId)) {
      const runner = userMap.get(run.userId);
      lastCompletedByTask.set(run.taskId, {
        date: run.completedAt,
        summary: {
          id: run.id,
          userId: run.userId,
          userName: runner?.name ?? 'Recruit',
          completedAt: run.completedAt.toISOString(),
          xpAwarded: run.xpAwarded,
        },
      });
    }
  }

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
    const availability = computeNextAvailableAt(
      recurrenceType,
      t.cooldownDays,
      lastCompleted?.date ?? null
    );

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
      assignedUserId: t.assignedUserId,
      isActive: t.isActive,
      activeRun,
      lastCompletedRun: lastCompleted?.summary ?? null,
      lastCompletedAt: lastCompleted ? lastCompleted.date.toISOString() : null,
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
      userId: run.userId,
      userName: userMap.get(run.userId)?.name ?? 'Recruit',
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
    excludedUserIds: Array.isArray(r.excludedUserIds) ? r.excludedUserIds : [],
    isActive: r.isActive,
  }));

  const invitationDtos: InvitationDTO[] = pendingInvites.map((inv) => ({
    id: inv.id,
    fortId: inv.fortId,
    fortName: fort.name,
    invitedByName: userMap.get(inv.invitedByUserId)?.name ?? 'Commander',
    targetEmail: inv.targetEmail,
    role: inv.role as MembershipRole,
    note: inv.note,
    status: inv.status as InvitationStatus,
    createdAt: inv.createdAt.toISOString(),
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
      inviteCode: fort.inviteCode,
    },
    members,
    areas: areaDtos,
    tasks: taskDtos,
    recentRuns: recentRunDtos,
    rewards: rewardDtos,
    invitations: invitationDtos,
  };
}
