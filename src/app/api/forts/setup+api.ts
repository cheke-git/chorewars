import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { areas, fortMemberships, forts, getDb, rewards, tasks, users } from '@/db';
import {
  HttpError,
  generateInviteCode,
  handleApiError,
  hashSecret,
  requireAuth,
} from '@/server/auth';
import { buildFortState, buildSessionPayload } from '@/server/fortState';
import { generateStarterPlan } from '@/shared/templates';

const supervisedMemberSchema = z.object({
  existingUserId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(40),
  role: z.enum(['reviewer', 'recruit']).default('recruit'),
  isAdult: z.boolean().default(false),
  avatarKey: z.string().min(1).default('kid-male'),
});

const starterTaskSchema = z.object({
  areaTempKey: z.string().nullable().default(null),
  title: z.string().trim().min(1).max(80),
  categoryKey: z.string().min(1).default('custom'),
  xp: z.number().int().min(1).max(500),
  recurrenceType: z
    .enum(['daily', 'cooldown', 'weekly', 'monthly', 'one_off', 'on_demand'])
    .default('daily'),
  cooldownDays: z.number().int().min(1).max(30).nullable().default(null),
});

const starterRewardSchema = z.object({
  title: z.string().trim().max(80).optional(),
  targetXp: z.number().int().min(5).max(5000),
  excludeAdults: z.boolean().default(true),
});

const setupSchema = z.object({
  name: z.string().trim().min(2, 'Give your Fort a name.').max(60),
  homeType: z.enum(['house', 'apartment', 'studio']),
  bedroomCount: z.number().int().min(0).max(10),
  bathroomCount: z.number().int().min(0).max(8),
  hasKitchen: z.boolean(),
  hasYard: z.boolean(),
  hasPets: z.boolean(),
  cochName: z.string().trim().min(1).max(40).optional(),
  cochAvatarKey: z.string().min(1).optional(),
  cochPin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')
    .optional(),
  supervisedMembers: z.array(supervisedMemberSchema).default([]),
  starterTasks: z.array(starterTaskSchema).optional(),
  starterReward: starterRewardSchema.optional(),
  starterRewards: z.array(starterRewardSchema).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid Fort setup data.', 400);
    }

    const data = parsed.data;
    const db = getDb();

    // Update CoCh user profile/PIN if provided during setup
    const userUpdates: Partial<typeof users.$inferInsert> = {};
    if (data.cochName) userUpdates.name = data.cochName;
    if (data.cochAvatarKey) userUpdates.avatarKey = data.cochAvatarKey;
    if (data.cochPin) userUpdates.guardianPinHash = hashSecret(data.cochPin);

    if (Object.keys(userUpdates).length > 0) {
      await db.update(users).set(userUpdates).where(eq(users.id, auth.userId));
    }

    const [createdFort] = await db
      .insert(forts)
      .values({
        createdByUserId: auth.userId,
        name: data.name,
        homeType: data.homeType,
        bedroomCount: data.bedroomCount,
        bathroomCount: data.bathroomCount,
        hasKitchen: data.hasKitchen,
        hasYard: data.hasYard,
        hasPets: data.hasPets,
        inviteCode: generateInviteCode(6),
      })
      .returning();

    // Add creator as CoCh
    await db.insert(fortMemberships).values({
      fortId: createdFort.id,
      userId: auth.userId,
      role: 'coch',
    });

    const fortUserRecords: { id: string; isAdult: boolean }[] = [
      { id: auth.userId, isAdult: true },
    ];

    for (const member of data.supervisedMembers) {
      let memberUserId = member.existingUserId;
      let isAdult = member.isAdult;

      if (memberUserId) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.id, memberUserId))
          .limit(1);
        if (!existing || existing.guardianUserId !== auth.userId) {
          throw new HttpError('Invalid supervised user selection.', 403);
        }
        isAdult = existing.isAdult;
      } else {
        const [createdKid] = await db
          .insert(users)
          .values({
            guardianUserId: auth.userId,
            name: member.name,
            avatarKey: member.avatarKey,
            isAdult: member.isAdult,
          })
          .returning();
        memberUserId = createdKid.id;
      }

      await db.insert(fortMemberships).values({
        fortId: createdFort.id,
        userId: memberUserId,
        role: member.role,
      });
      fortUserRecords.push({ id: memberUserId, isAdult });
    }

    const plan = generateStarterPlan({
      homeType: data.homeType,
      bedroomCount: data.bedroomCount,
      bathroomCount: data.bathroomCount,
      hasKitchen: data.hasKitchen,
      hasYard: data.hasYard,
      hasPets: data.hasPets,
    });

    const areaIdByTempKey = new Map<string, string>();
    if (plan.areas.length > 0) {
      const insertedAreas = await db
        .insert(areas)
        .values(
          plan.areas.map((area, index) => ({
            fortId: createdFort.id,
            name: area.name,
            categoryKey: area.categoryKey,
            iconKey: area.iconKey,
            defaultXp: area.defaultXp,
            sortOrder: index,
          }))
        )
        .returning();

      plan.areas.forEach((templateArea, index) => {
        const inserted = insertedAreas[index];
        if (inserted) {
          areaIdByTempKey.set(templateArea.tempKey, inserted.id);
        }
      });
    }

    const tasksToInsert = data.starterTasks ?? plan.tasks;
    if (tasksToInsert.length > 0) {
      await db.insert(tasks).values(
        tasksToInsert.map((task) => ({
          fortId: createdFort.id,
          areaId: task.areaTempKey ? (areaIdByTempKey.get(task.areaTempKey) ?? null) : null,
          title: task.title,
          categoryKey: task.categoryKey,
          xp: task.xp,
          recurrenceType: task.recurrenceType,
          cooldownDays: task.cooldownDays,
          validationMode: 'honor',
        }))
      );
    }

    const rewardsToInsert =
      data.starterRewards ?? (data.starterReward ? [data.starterReward] : []);
    if (rewardsToInsert.length > 0) {
      await db.insert(rewards).values(
        rewardsToInsert.map((reward) => {
          const excludedIds = reward.excludeAdults
            ? fortUserRecords.filter((u) => u.isAdult).map((u) => u.id)
            : [];
          const allExcluded = excludedIds.length === fortUserRecords.length;
          return {
            fortId: createdFort.id,
            title: reward.title?.trim() || null,
            type: 'individual_goal',
            targetXp: reward.targetXp,
            excludedUserIds: allExcluded ? [] : excludedIds,
          };
        })
      );
    }

    const [fortState, session] = await Promise.all([
      buildFortState(createdFort.id),
      buildSessionPayload(auth.userId),
    ]);

    return Response.json({ fortState, session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
