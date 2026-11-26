import { z } from 'zod';

import { areas, forts, getDb, profiles, rewards, tasks } from '@/db';
import { HttpError, handleApiError, hashSecret, requireAuth } from '@/server/auth';
import { buildFortState, getFortByAccountId } from '@/server/fortState';
import { generateStarterPlan } from '@/shared/templates';

const memberSchema = z.object({
  name: z.string().trim().min(1).max(40),
  role: z.enum(['coch', 'reviewer', 'recruit']),
  isAdult: z.boolean(),
  avatarKey: z.string().min(1),
});

const setupSchema = z.object({
  name: z.string().trim().min(2, 'Give your Fort a name.').max(60),
  homeType: z.enum(['house', 'apartment', 'studio']),
  bedroomCount: z.number().int().min(0).max(10),
  bathroomCount: z.number().int().min(0).max(8),
  hasKitchen: z.boolean(),
  hasYard: z.boolean(),
  hasPets: z.boolean(),
  cochPin: z.string().regex(/^\d{4}$/, 'CoCh PIN must be exactly 4 digits.'),
  members: z.array(memberSchema).min(1, 'Add at least the Commander in Chief profile.'),
  starterReward: z
    .object({
      title: z.string().trim().max(80).optional(),
      targetXp: z.number().int().min(5).max(5000),
      excludeAdults: z.boolean().default(true),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const existingFort = await getFortByAccountId(session.accountId);
    if (existingFort) {
      throw new HttpError('This account already has a Fort set up.', 409);
    }

    const body = await request.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid Fort setup data.', 400);
    }

    const data = parsed.data;
    const db = getDb();

    const [createdFort] = await db
      .insert(forts)
      .values({
        ownerAccountId: session.accountId,
        name: data.name,
        homeType: data.homeType,
        bedroomCount: data.bedroomCount,
        bathroomCount: data.bathroomCount,
        hasKitchen: data.hasKitchen,
        hasYard: data.hasYard,
        hasPets: data.hasPets,
        cochPinHash: hashSecret(data.cochPin),
      })
      .returning();

    const createdProfiles = await db
      .insert(profiles)
      .values(
        data.members.map((member) => ({
          fortId: createdFort.id,
          name: member.name,
          role: member.role,
          isAdult: member.isAdult,
          avatarKey: member.avatarKey,
        }))
      )
      .returning();

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

    if (plan.tasks.length > 0) {
      await db.insert(tasks).values(
        plan.tasks.map((task) => ({
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

    if (data.starterReward) {
      const excludedIds = data.starterReward.excludeAdults
        ? createdProfiles.filter((p) => p.isAdult).map((p) => p.id)
        : [];
      const allExcluded = excludedIds.length === createdProfiles.length;

      await db.insert(rewards).values({
        fortId: createdFort.id,
        title: data.starterReward.title?.trim() || null,
        type: 'individual_goal',
        targetXp: data.starterReward.targetXp,
        excludedProfileIds: allExcluded ? [] : excludedIds,
      });
    }

    const state = await buildFortState(createdFort.id);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
