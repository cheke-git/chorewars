import { and, eq } from 'drizzle-orm';

import { getDb, taskRuns, tasks } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortAccessForSession } from '@/server/fortState';

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)\/cancel/);

    const db = getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) {
      throw new HttpError('Task not found.', 404);
    }

    await requireFortAccessForSession(task.fortId, auth.userId);

    await db
      .update(taskRuns)
      .set({ status: 'expired' })
      .where(
        and(
          eq(taskRuns.taskId, taskId),
          eq(taskRuns.fortId, task.fortId),
          eq(taskRuns.status, 'in_progress')
        )
      );

    const state = await buildFortState(task.fortId);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
