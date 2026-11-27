import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { forts, getDb } from '@/db';
import {
  HttpError,
  extractRouteParam,
  generateInviteCode,
  handleApiError,
  requireAuth,
} from '@/server/auth';
import {
  buildFortState,
  buildSessionPayload,
  requireFortAccessForSession,
  requireFortCoch,
} from '@/server/fortState';

const updateFortSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  regenerateInviteCode: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const fortId = extractRouteParam(request, params, 'id', /\/api\/forts\/([^/]+)/);
    await requireFortAccessForSession(fortId, auth.userId);
    const state = await buildFortState(fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const fortId = extractRouteParam(request, params, 'id', /\/api\/forts\/([^/]+)/);
    await requireFortCoch(fortId, auth.userId);

    const body = await request.json();
    const parsed = updateFortSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid Fort update.', 400);
    }

    const updates: Partial<typeof forts.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.regenerateInviteCode) updates.inviteCode = generateInviteCode(6);
    if (parsed.data.isArchived !== undefined) updates.isArchived = parsed.data.isArchived;

    if (Object.keys(updates).length > 0) {
      const db = getDb();
      await db.update(forts).set(updates).where(eq(forts.id, fortId));
    }

    const session = await buildSessionPayload(auth.userId);
    const fortState = parsed.data.isArchived ? null : await buildFortState(fortId);
    return Response.json({ fortState, session });
  } catch (error) {
    return handleApiError(error);
  }
}
