import { z } from 'zod';

import { areas, getDb } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const createAreaSchema = z.object({
  fortId: z.string().uuid('Invalid Fort ID.'),
  name: z.string().trim().min(1, 'Area name is required.').max(40),
  categoryKey: z.string().trim().min(1).default('custom'),
  defaultXp: z.number().int().min(5).max(500).default(15),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = createAreaSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid area data.', 400);
    }

    await requireFortCoch(parsed.data.fortId, auth.userId);

    const db = getDb();
    await db.insert(areas).values({
      fortId: parsed.data.fortId,
      name: parsed.data.name,
      categoryKey: parsed.data.categoryKey,
      defaultXp: parsed.data.defaultXp,
    });

    const state = await buildFortState(parsed.data.fortId);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
