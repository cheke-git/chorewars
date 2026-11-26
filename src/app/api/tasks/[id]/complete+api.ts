import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, profiles, taskRuns, tasks } from '@/db';
import { HttpError, handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

const completeSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID.'),
  comment: z.string().trim().max(240).optional(),
});

function extractTaskId(request: Request, params?: Record<string, string>): string {
  if (params?.id) {
    return params.id;
  }
  const match = new URL(request.url).pathname.match(/\/api\/tasks\/([^/]+)\/complete/);
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

    const body = await request.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid completion request.', 400);
    }

    const db = getDb();

    const [[task], [profile], [activeRun]] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.fortId, fort.id)))
        .limit(1),
      db
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, parsed.data.profileId), eq(profiles.fortId, fort.id)))
        .limit(1),
      db
        .select()
        .from(taskRuns)
        .where(
          and(
            eq(taskRuns.taskId, taskId),
            eq(taskRuns.fortId, fort.id),
            eq(taskRuns.status, 'in_progress')
          )
        )
        .limit(1),
    ]);

    if (!task) {
      throw new HttpError('Task not found.', 404);
    }
    if (!profile) {
      throw new HttpError('Profile not found in this Fort.', 404);
    }

    const now = new Date();
    const comment = parsed.data.comment?.trim() || null;

    if (activeRun) {
      const durationSeconds = Math.max(
        1,
        Math.round((now.getTime() - activeRun.startedAt.getTime()) / 1000)
      );
      await db
        .update(taskRuns)
        .set({
          profileId: profile.id,
          status: 'approved',
          completedAt: now,
          durationSeconds,
          xpAwarded: task.xp,
          comment,
        })
        .where(eq(taskRuns.id, activeRun.id));
    } else {
      await db.insert(taskRuns).values({
        taskId: task.id,
        fortId: fort.id,
        profileId: profile.id,
        status: 'approved',
        startedAt: now,
        completedAt: now,
        durationSeconds: 0,
        xpAwarded: task.xp,
        comment,
      });
    }

    await db
      .update(profiles)
      .set({
        xpTotal: sql`${profiles.xpTotal} + ${task.xp}`,
      })
      .where(eq(profiles.id, profile.id));

    const state = await buildFortState(fort.id);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
