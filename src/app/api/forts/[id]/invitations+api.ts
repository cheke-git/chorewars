import { z } from 'zod';

import { fortInvitations, getDb } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const createInvitationSchema = z.object({
  targetEmail: z.string().trim().email('Enter a valid adult/guardian email address.'),
  role: z.enum(['coch', 'reviewer', 'recruit']).default('recruit'),
  note: z.string().trim().max(160).optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const fortId = extractRouteParam(
      request,
      params,
      'id',
      /\/api\/forts\/([^/]+)\/invitations/
    );
    await requireFortCoch(fortId, auth.userId);

    const body = await request.json();
    const parsed = createInvitationSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid invitation.', 400);
    }

    const db = getDb();
    await db.insert(fortInvitations).values({
      fortId,
      invitedByUserId: auth.userId,
      targetEmail: parsed.data.targetEmail.toLowerCase(),
      role: parsed.data.role,
      note: parsed.data.note?.trim() || null,
      status: 'pending',
    });

    const fortState = await buildFortState(fortId);
    return Response.json(fortState, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
