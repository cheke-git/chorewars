import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { fortMemberships, getDb, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, buildSessionPayload, requireFortCoch } from '@/server/fortState';

const updateRoleSchema = z.object({
  role: z.enum(['coch', 'reviewer', 'recruit']),
});

export async function PATCH(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const fortId = extractRouteParam(
      request,
      params,
      'id',
      /\/api\/forts\/([^/]+)\/members\/[^/]+/
    );
    const targetUserId = extractRouteParam(
      request,
      params,
      'userId',
      /\/api\/forts\/[^/]+\/members\/([^/]+)/
    );

    await requireFortCoch(fortId, auth.userId);

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Invalid role value.', 400);
    }

    const db = getDb();
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) {
      throw new HttpError('Member user not found.', 404);
    }

    if (parsed.data.role === 'coch' && targetUser.guardianUserId) {
      throw new HttpError(
        'Only full accounts can be promoted to Commander in Chief (CoCh). Supervised accounts can be Reviewers or Recruits.',
        400
      );
    }

    const activeMembers = await db
      .select()
      .from(fortMemberships)
      .where(and(eq(fortMemberships.fortId, fortId), isNull(fortMemberships.leftAt)));

    const targetMembership = activeMembers.find((m) => m.userId === targetUserId);
    if (!targetMembership) {
      throw new HttpError('User is not an active member of this Fort.', 404);
    }

    if (targetMembership.role === 'coch' && parsed.data.role !== 'coch') {
      const otherCochs = activeMembers.filter(
        (m) => m.role === 'coch' && m.userId !== targetUserId
      );
      if (otherCochs.length === 0) {
        throw new HttpError('A Fort must keep at least one Commander in Chief (CoCh).', 400);
      }
    }

    await db
      .update(fortMemberships)
      .set({ role: parsed.data.role })
      .where(eq(fortMemberships.id, targetMembership.id));

    const [fortState, session] = await Promise.all([
      buildFortState(fortId),
      buildSessionPayload(auth.userId),
    ]);

    return Response.json({ fortState, session });
  } catch (error) {
    return handleApiError(error);
  }
}
