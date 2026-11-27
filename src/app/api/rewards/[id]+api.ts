import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, rewards } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const updateRewardSchema = z.object({
  title: z.string().trim().max(80).nullable().optional(),
  targetXp: z.number().int().min(5).max(10000).optional(),
  excludedUserIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const rewardId = extractRouteParam(request, params, 'id', /\/api\/rewards\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(rewards).where(eq(rewards.id, rewardId)).limit(1);
    if (!existing) {
      throw new HttpError('Reward not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    const body = await request.json();
    const parsed = updateRewardSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid reward update.', 400);
    }

    const updates: Partial<typeof rewards.$inferInsert> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title?.trim() || null;
    if (parsed.data.targetXp !== undefined) updates.targetXp = parsed.data.targetXp;
    if (parsed.data.excludedUserIds !== undefined) {
      updates.excludedUserIds = parsed.data.excludedUserIds;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(rewards).set(updates).where(eq(rewards.id, rewardId));
    }

    const state = await buildFortState(existing.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const rewardId = extractRouteParam(request, params, 'id', /\/api\/rewards\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(rewards).where(eq(rewards.id, rewardId)).limit(1);
    if (!existing) {
      throw new HttpError('Reward not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    await db.update(rewards).set({ isActive: false }).where(eq(rewards.id, rewardId));

    const state = await buildFortState(existing.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
