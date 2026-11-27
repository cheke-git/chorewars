import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { forts, getDb } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import {
  assertActingUserAuthorized,
  buildFortState,
  buildSessionPayload,
  ensureActiveMembership,
} from '@/server/fortState';

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, 'Enter a valid Fort invite code.').max(16),
  userIds: z.array(z.string().uuid()).min(1, 'Select at least one character to join.').optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid invite code.', 400);
    }

    const code = parsed.data.inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const db = getDb();

    const [fort] = await db
      .select()
      .from(forts)
      .where(and(eq(forts.inviteCode, code), eq(forts.isArchived, false)))
      .limit(1);

    if (!fort) {
      throw new HttpError('No active Fort found with that invite code.', 404);
    }

    const targetUserIds = parsed.data.userIds ?? [auth.userId];
    for (const userId of targetUserIds) {
      await assertActingUserAuthorized(auth.userId, userId);
      await ensureActiveMembership(fort.id, userId, 'recruit');
    }

    const [fortState, session] = await Promise.all([
      buildFortState(fort.id),
      buildSessionPayload(auth.userId),
    ]);

    return Response.json({ fortState, session });
  } catch (error) {
    return handleApiError(error);
  }
}
