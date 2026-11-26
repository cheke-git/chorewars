import { z } from 'zod';

import { getDb, profiles } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

const createProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(40),
  role: z.enum(['coch', 'reviewer', 'recruit']).default('recruit'),
  isAdult: z.boolean().default(false),
  avatarKey: z.string().min(1).default('broom-knight'),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);

    const body = await request.json();
    const parsed = createProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid profile data.', 400);
    }

    const db = getDb();
    await db.insert(profiles).values({
      fortId: fort.id,
      name: parsed.data.name,
      role: parsed.data.role,
      isAdult: parsed.data.isAdult,
      avatarKey: parsed.data.avatarKey,
    });

    const state = await buildFortState(fort.id);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
