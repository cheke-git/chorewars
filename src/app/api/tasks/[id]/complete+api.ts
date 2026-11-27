import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { fortMemberships, getDb, taskRuns, tasks, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import {
  assertActingUserAuthorized,
  buildFortState,
  buildSessionPayload,
  requireFortMembership,
} from '@/server/fortState';

const completeSchema = z.object({
  userId: z.string().uuid('Invalid user ID.'),
  comment: z.string().trim().max(240).optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)\/complete/);

    const body = await request.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid completion request.', 400);
    }

    await assertActingUserAuthorized(auth.userId, parsed.data.userId);

    const db = getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task || !task.isActive) {
      throw new HttpError('Task not found.', 404);
    }

    const membership = await requireFortMembership(task.fortId, parsed.data.userId);

    const [activeRun] = await db
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
          userId: parsed.data.userId,
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
        fortId: task.fortId,
        userId: parsed.data.userId,
        status: 'approved',
        startedAt: now,
        completedAt: now,
        durationSeconds: 0,
        xpAwarded: task.xp,
        comment,
      });
    }

    // Increment BOTH global Career XP and per-Fort XP
    await Promise.all([
      db
        .update(users)
        .set({ careerXp: sql`${users.careerXp} + ${task.xp}` })
        .where(eq(users.id, parsed.data.userId)),
      db
        .update(fortMemberships)
        .set({ fortXp: sql`${fortMemberships.fortXp} + ${task.xp}` })
        .where(eq(fortMemberships.id, membership.id)),
    ]);

    const [fortState, session] = await Promise.all([
      buildFortState(task.fortId),
      buildSessionPayload(auth.userId),
    ]);

    return Response.json({ fortState, session });
  } catch (error) {
    return handleApiError(error);
  }
}
