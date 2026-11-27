import { z } from 'zod';

import { getDb, tasks } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortCoch } from '@/server/fortState';

const createTaskSchema = z.object({
  fortId: z.string().uuid('Invalid Fort ID.'),
  title: z.string().trim().min(2, 'Task title is required.').max(80),
  areaId: z.string().uuid().nullable().optional(),
  categoryKey: z.string().trim().min(1).default('custom'),
  xp: z.number().int().min(1).max(500).default(10),
  recurrenceType: z
    .enum(['daily', 'cooldown', 'weekly', 'monthly', 'one_off', 'on_demand'])
    .default('daily'),
  cooldownDays: z.number().int().min(1).max(60).nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid task data.', 400);
    }

    await requireFortCoch(parsed.data.fortId, auth.userId);

    const db = getDb();
    await db.insert(tasks).values({
      fortId: parsed.data.fortId,
      areaId: parsed.data.areaId ?? null,
      title: parsed.data.title,
      categoryKey: parsed.data.categoryKey,
      xp: parsed.data.xp,
      recurrenceType: parsed.data.recurrenceType,
      cooldownDays:
        parsed.data.recurrenceType === 'cooldown' ? (parsed.data.cooldownDays ?? 3) : null,
      validationMode: 'honor',
      assignedUserId: parsed.data.assignedUserId ?? null,
    });

    const state = await buildFortState(parsed.data.fortId);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
