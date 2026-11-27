import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { fortMemberships, getDb, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import {
  buildFortState,
  buildSessionPayload,
  requireFortAccessForSession,
} from '@/server/fortState';

const leaveSchema = z.object({
  userId: z.string().uuid().optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const fortId = extractRouteParam(request, params, 'id', /\/api\/forts\/([^/]+)\/leave/);

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Invalid leave request.', 400);
    }

    const targetUserId = parsed.data.userId ?? auth.userId;
    const db = getDb();

    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) {
      throw new HttpError('User not found.', 404);
    }

    const isSelf = targetUserId === auth.userId;
    const isGuardian = targetUser.guardianUserId === auth.userId;

    // Check if caller is CoCh of this Fort when removing someone else
    const [callerMembership] = await db
      .select()
      .from(fortMemberships)
      .where(
        and(
          eq(fortMemberships.fortId, fortId),
          eq(fortMemberships.userId, auth.userId),
          isNull(fortMemberships.leftAt)
        )
      )
      .limit(1);

    const isCoch = callerMembership?.role === 'coch';

    if (!isSelf && !isGuardian && !isCoch) {
      throw new HttpError('You do not have permission to remove this member.', 403);
    }

    const activeMembers = await db
      .select()
      .from(fortMemberships)
      .where(and(eq(fortMemberships.fortId, fortId), isNull(fortMemberships.leftAt)));

    const targetMembership = activeMembers.find((m) => m.userId === targetUserId);
    if (!targetMembership) {
      throw new HttpError('User is not an active member of this Fort.', 404);
    }

    // Protect against leaving a Fort with zero CoChs while other members remain
    if (targetMembership.role === 'coch') {
      const otherCochs = activeMembers.filter(
        (m) => m.role === 'coch' && m.userId !== targetUserId
      );
      if (otherCochs.length === 0 && activeMembers.length > 1) {
        throw new HttpError(
          'Promote another full-account member to CoCh before leaving this Fort (or archive the Fort).',
          400
        );
      }
    }

    await db
      .update(fortMemberships)
      .set({ leftAt: new Date() })
      .where(eq(fortMemberships.id, targetMembership.id));

    const session = await buildSessionPayload(auth.userId);
    let fortState = null;
    try {
      await requireFortAccessForSession(fortId, auth.userId);
      fortState = await buildFortState(fortId);
    } catch {
      fortState = null;
    }

    return Response.json({ session, fortState });
  } catch (error) {
    return handleApiError(error);
  }
}
