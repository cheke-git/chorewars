import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { fortInvitations, getDb, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import {
  assertActingUserAuthorized,
  buildFortState,
  buildSessionPayload,
  ensureActiveMembership,
} from '@/server/fortState';
import type { MembershipRole } from '@/shared/types';

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  userIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const inviteId = extractRouteParam(
      request,
      params,
      'id',
      /\/api\/invitations\/([^/]+)\/respond/
    );

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Invalid invitation response.', 400);
    }

    const db = getDb();
    const [[invite], [me]] = await Promise.all([
      db.select().from(fortInvitations).where(eq(fortInvitations.id, inviteId)).limit(1),
      db.select().from(users).where(eq(users.id, auth.userId)).limit(1),
    ]);

    if (!invite || invite.status !== 'pending') {
      throw new HttpError('This invitation is no longer active.', 404);
    }
    if (!me?.email || me.email.toLowerCase() !== invite.targetEmail.toLowerCase()) {
      throw new HttpError('This invitation was addressed to another account.', 403);
    }

    if (parsed.data.action === 'decline') {
      await db
        .update(fortInvitations)
        .set({ status: 'declined', respondedAt: new Date() })
        .where(eq(fortInvitations.id, inviteId));

      const session = await buildSessionPayload(auth.userId);
      return Response.json({ session, fortState: null });
    }

    const targetUserIds =
      parsed.data.userIds && parsed.data.userIds.length > 0 ? parsed.data.userIds : [auth.userId];

    for (const userId of targetUserIds) {
      const targetUser = await assertActingUserAuthorized(auth.userId, userId);
      // Supervised kids cannot receive 'coch' role even if the email invite offered 'coch' to the parent
      const assignedRole: MembershipRole =
        targetUser.guardianUserId && invite.role === 'coch'
          ? 'recruit'
          : (invite.role as MembershipRole);
      await ensureActiveMembership(invite.fortId, userId, assignedRole);
    }

    await db
      .update(fortInvitations)
      .set({ status: 'accepted', respondedAt: new Date() })
      .where(eq(fortInvitations.id, inviteId));

    const [session, fortState] = await Promise.all([
      buildSessionPayload(auth.userId),
      buildFortState(invite.fortId),
    ]);

    return Response.json({ session, fortState });
  } catch (error) {
    return handleApiError(error);
  }
}
