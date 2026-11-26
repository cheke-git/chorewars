import { z } from 'zod';

import { getDb, rewards } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

const createRewardSchema = z.object({
  title: z.string().trim().max(80).optional(),
  type: z.enum(['individual_goal', 'bounty_pool']).default('individual_goal'),
  targetXp: z.number().int().min(5, 'Target XP must be at least 5.').max(10000),
  poolAmountCents: z.number().int().min(0).nullable().optional(),
  excludedProfileIds: z.array(z.string().uuid()).default([]),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);

    const body = await request.json();
    const parsed = createRewardSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid reward data.', 400);
    }

    const db = getDb();
    await db.insert(rewards).values({
      fortId: fort.id,
      title: parsed.data.title?.trim() || null,
      type: parsed.data.type,
      targetXp: parsed.data.targetXp,
      poolAmountCents: parsed.data.poolAmountCents ?? null,
      excludedProfileIds: parsed.data.excludedProfileIds,
    });

    const state = await buildFortState(fort.id);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
