import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import {
  buildFortState,
  buildSessionPayload,
  ensureActiveMembership,
  requireFortCoch,
} from '@/server/fortState';

const createSupervisedSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(40),
  avatarKey: z.string().min(1).default('kid-male'),
  isAdult: z.boolean().default(false),
  fortId: z.string().uuid().optional(),
  role: z.enum(['reviewer', 'recruit']).default('recruit'),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = createSupervisedSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid profile data.', 400);
    }

    const { name, avatarKey, isAdult, fortId, role } = parsed.data;
    if (fortId) {
      await requireFortCoch(fortId, auth.userId);
    }

    const db = getDb();
    const [created] = await db
      .insert(users)
      .values({
        guardianUserId: auth.userId,
        name,
        avatarKey,
        isAdult,
      })
      .returning();

    if (fortId) {
      await ensureActiveMembership(fortId, created.id, role);
    }

    const [session, fortState] = await Promise.all([
      buildSessionPayload(auth.userId),
      fortId ? buildFortState(fortId) : Promise.resolve(null),
    ]);

    return Response.json({ session, fortState, userId: created.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
