import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, tasks } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  areaId: z.string().uuid().nullable().optional(),
  categoryKey: z.string().trim().min(1).optional(),
  xp: z.number().int().min(1).max(500).optional(),
  recurrenceType: z
    .enum(['daily', 'cooldown', 'weekly', 'monthly', 'one_off', 'on_demand'])
    .optional(),
  cooldownDays: z.number().int().min(1).max(60).nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!existing) {
      throw new HttpError('Task not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid task update.', 400);
    }

    const updates: Partial<typeof tasks.$inferInsert> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.areaId !== undefined) updates.areaId = parsed.data.areaId;
    if (parsed.data.categoryKey !== undefined) updates.categoryKey = parsed.data.categoryKey;
    if (parsed.data.xp !== undefined) updates.xp = parsed.data.xp;
    if (parsed.data.recurrenceType !== undefined) {
      updates.recurrenceType = parsed.data.recurrenceType;
      updates.cooldownDays =
        parsed.data.recurrenceType === 'cooldown'
          ? (parsed.data.cooldownDays ?? existing.cooldownDays ?? 3)
          : null;
    } else if (parsed.data.cooldownDays !== undefined) {
      updates.cooldownDays = parsed.data.cooldownDays;
    }
    if (parsed.data.assignedUserId !== undefined) {
      updates.assignedUserId = parsed.data.assignedUserId;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
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
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!existing) {
      throw new HttpError('Task not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    // Soft-archive to preserve historical runs & person-agnostic habit analytics
    await db.update(tasks).set({ isActive: false }).where(eq(tasks.id, taskId));

    const state = await buildFortState(existing.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
