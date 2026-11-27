import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { assertActingUserAuthorized, buildSessionPayload } from '@/server/fortState';

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  avatarKey: z.string().min(1).optional(),
  isAdult: z.boolean().optional(),
});

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const targetId = extractRouteParam(request, params, 'id', /\/api\/users\/([^/]+)/);
    await assertActingUserAuthorized(auth.userId, targetId);

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid update data.', 400);
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.avatarKey !== undefined) updates.avatarKey = parsed.data.avatarKey;
    if (parsed.data.isAdult !== undefined) updates.isAdult = parsed.data.isAdult;

    if (Object.keys(updates).length > 0) {
      const db = getDb();
      await db.update(users).set(updates).where(eq(users.id, targetId));
    }

    const session = await buildSessionPayload(auth.userId);
    return Response.json(session);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const targetId = extractRouteParam(request, params, 'id', /\/api\/users\/([^/]+)/);
    const target = await assertActingUserAuthorized(auth.userId, targetId);

    if (!target.guardianUserId) {
      throw new HttpError('Cannot delete a full account here.', 400);
    }

    const db = getDb();
    await db.delete(users).where(eq(users.id, targetId));

    const session = await buildSessionPayload(auth.userId);
    return Response.json(session);
  } catch (error) {
    return handleApiError(error);
  }
}
