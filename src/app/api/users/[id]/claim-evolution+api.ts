import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { assertActingUserAuthorized, buildSessionPayload } from '@/server/fortState';
import { getRankInfo } from '@/shared/types';

const claimSchema = z.object({
  targetTier: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const targetId = extractRouteParam(
      request,
      params,
      'id',
      /\/api\/users\/([^/]+)\/claim-evolution/
    );
    const target = await assertActingUserAuthorized(auth.userId, targetId);

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Invalid evolution claim request.', 400);
    }

    const earnedTier = getRankInfo(target.careerXp).artTier;
    const requestedTier = parsed.data.targetTier ?? earnedTier;
    const nextClaimedTier = Math.max(
      target.claimedArtTier,
      Math.min(earnedTier, requestedTier)
    );

    if (nextClaimedTier > target.claimedArtTier) {
      const db = getDb();
      await db
        .update(users)
        .set({ claimedArtTier: nextClaimedTier })
        .where(eq(users.id, targetId));
    }

    const session = await buildSessionPayload(auth.userId);
    return Response.json(session);
  } catch (error) {
    return handleApiError(error);
  }
}
