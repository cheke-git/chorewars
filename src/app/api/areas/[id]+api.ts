import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { areas, getDb } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const updateAreaSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  defaultXp: z.number().int().min(5).max(500).optional(),
  categoryKey: z.string().trim().min(1).optional(),
});

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const areaId = extractRouteParam(request, params, 'id', /\/api\/areas\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(areas).where(eq(areas.id, areaId)).limit(1);
    if (!existing) {
      throw new HttpError('Area not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    const body = await request.json();
    const parsed = updateAreaSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid area update.', 400);
    }

    const updates: Partial<typeof areas.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.defaultXp !== undefined) updates.defaultXp = parsed.data.defaultXp;
    if (parsed.data.categoryKey !== undefined) updates.categoryKey = parsed.data.categoryKey;

    if (Object.keys(updates).length > 0) {
      await db.update(areas).set(updates).where(eq(areas.id, areaId));
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
    const areaId = extractRouteParam(request, params, 'id', /\/api\/areas\/([^/]+)/);

    const db = getDb();
    const [existing] = await db.select().from(areas).where(eq(areas.id, areaId)).limit(1);
    if (!existing) {
      throw new HttpError('Area not found.', 404);
    }

    await requireFortCoch(existing.fortId, auth.userId);

    // Tasks referencing this area safely move to General (areaId = null via onDelete: 'set null')
    await db.delete(areas).where(eq(areas.id, areaId));

    const state = await buildFortState(existing.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
