import { z } from 'zod';

import { getDb, tasks } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title is required.').max(80),
  areaId: z.string().uuid().nullable().optional(),
  categoryKey: z.string().trim().min(1).default('custom'),
  xp: z.number().int().min(1).max(500).default(10),
  recurrenceType: z.enum(['daily', 'cooldown', 'weekly', 'monthly', 'one_off']).default('daily'),
  cooldownDays: z.number().int().min(1).max(60).nullable().optional(),
  assignedProfileId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid task data.', 400);
    }

    const db = getDb();
    await db.insert(tasks).values({
      fortId: fort.id,
      areaId: parsed.data.areaId ?? null,
      title: parsed.data.title,
      categoryKey: parsed.data.categoryKey,
      xp: parsed.data.xp,
      recurrenceType: parsed.data.recurrenceType,
      cooldownDays:
        parsed.data.recurrenceType === 'cooldown' ? (parsed.data.cooldownDays ?? 3) : null,
      validationMode: 'honor',
      assignedProfileId: parsed.data.assignedProfileId ?? null,
    });

    const state = await buildFortState(fort.id);
    return Response.json(state, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
