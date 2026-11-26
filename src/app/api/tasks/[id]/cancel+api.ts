import { and, eq } from 'drizzle-orm';

import { getDb, taskRuns } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

function extractTaskId(request: Request, params?: Record<string, string>): string {
  if (params?.id) {
    return params.id;
  }
  const match = new URL(request.url).pathname.match(/\/api\/tasks\/([^/]+)\/cancel/);
  if (!match) {
    throw new HttpError('Missing task ID.', 400);
  }
  return match[1];
}

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);
    const taskId = extractTaskId(request, params);

    const db = getDb();
    await db
      .update(taskRuns)
      .set({ status: 'expired' })
      .where(
        and(
          eq(taskRuns.taskId, taskId),
          eq(taskRuns.fortId, fort.id),
          eq(taskRuns.status, 'in_progress')
        )
      );

    const state = await buildFortState(fort.id);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
