import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, taskRuns, tasks } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import {
  assertActingUserAuthorized,
  buildFortState,
  requireFortMembership,
} from '@/server/fortState';

const startSchema = z.object({
  userId: z.string().uuid('Invalid user ID.'),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)\/start/);

    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid start request.', 400);
    }

    await assertActingUserAuthorized(auth.userId, parsed.data.userId);

    const db = getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task || !task.isActive) {
      throw new HttpError('Task not found.', 404);
    }

    await requireFortMembership(task.fortId, parsed.data.userId);

    const [existingRun] = await db
      .select()
      .from(taskRuns)
      .where(
        and(
          eq(taskRuns.taskId, taskId),
          eq(taskRuns.fortId, task.fortId),
          eq(taskRuns.status, 'in_progress')
        )
      )
      .limit(1);

    if (existingRun) {
      throw new HttpError('This mission is already in progress.', 409);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 60 * 1000);

    await db.insert(taskRuns).values({
      taskId: task.id,
      fortId: task.fortId,
      userId: parsed.data.userId,
      status: 'in_progress',
      startedAt: now,
      expiresAt,
    });

    const state = await buildFortState(task.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
