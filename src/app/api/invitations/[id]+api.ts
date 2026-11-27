import { eq } from 'drizzle-orm';

import { fortInvitations, getDb } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

export async function DELETE(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const inviteId = extractRouteParam(request, params, 'id', /\/api\/invitations\/([^/]+)/);

    const db = getDb();
    const [invite] = await db
      .select()
      .from(fortInvitations)
      .where(eq(fortInvitations.id, inviteId))
      .limit(1);

    if (!invite) {
      throw new HttpError('Invitation not found.', 404);
    }

    await requireFortCoch(invite.fortId, auth.userId);

    await db
      .update(fortInvitations)
      .set({ status: 'revoked', respondedAt: new Date() })
      .where(eq(fortInvitations.id, inviteId));

    const fortState = await buildFortState(invite.fortId);
    return Response.json(fortState);
  } catch (error) {
    return handleApiError(error);
  }
}
