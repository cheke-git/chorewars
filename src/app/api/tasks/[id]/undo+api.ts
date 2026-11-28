import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { fortMemberships, getDb, taskRuns, tasks, users } from '@/db';
import { HttpError, extractRouteParam, handleApiError, requireAuth } from '@/server/auth';
import {
  assertActingUserAuthorized,
  buildFortState,
  buildSessionPayload,
} from '@/server/fortState';
import { getRankInfo } from '@/shared/types';

const undoSchema = z.object({
  actingUserId: z.string().uuid().optional(),
});

export async function POST(request: Request, params?: Record<string, string>) {
  try {
    const auth = await requireAuth(request);
    const taskId = extractRouteParam(request, params, 'id', /\/api\/tasks\/([^/]+)\/undo/);

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = undoSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Invalid undo request.', 400);
    }

    const actingUserId = parsed.data.actingUserId ?? auth.userId;
    await assertActingUserAuthorized(auth.userId, actingUserId);

    const db = getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) {
      throw new HttpError('Task not found.', 404);
    }

    const [latestRun] = await db
      .select()
      .from(taskRuns)
      .where(
        and(
          eq(taskRuns.taskId, taskId),
          eq(taskRuns.fortId, task.fortId),
          eq(taskRuns.status, 'approved')
        )
      )
      .orderBy(desc(taskRuns.completedAt))
      .limit(1);

    if (!latestRun) {
      throw new HttpError('No completed run found to undo.', 404);
    }

    // Allowed if the run belongs to the acting user, their supervised child, OR caller is CoCh of the Fort
    const [callerMembership] = await db
      .select()
      .from(fortMemberships)
      .where(
        and(
          eq(fortMemberships.fortId, task.fortId),
          eq(fortMemberships.userId, auth.userId),
          isNull(fortMemberships.leftAt)
        )
      )
      .limit(1);

    const isCoch = callerMembership?.role === 'coch';
    const isOwnRun = latestRun.userId === actingUserId;

    if (!isOwnRun && !isCoch) {
      throw new HttpError('Only the player who completed this mission or a CoCh can undo it.', 403);
    }

    await db
      .update(taskRuns)
      .set({ status: 'undone' })
      .where(eq(taskRuns.id, latestRun.id));

    if (latestRun.xpAwarded > 0) {
      const [[updatedUser]] = await Promise.all([
        db
          .update(users)
          .set({
            careerXp: sql`GREATEST(0, ${users.careerXp} - ${latestRun.xpAwarded})`,
          })
          .where(eq(users.id, latestRun.userId))
          .returning({ careerXp: users.careerXp, claimedArtTier: users.claimedArtTier }),
        db
          .update(fortMemberships)
          .set({
            fortXp: sql`GREATEST(0, ${fortMemberships.fortXp} - ${latestRun.xpAwarded})`,
          })
          .where(
            and(
              eq(fortMemberships.fortId, task.fortId),
              eq(fortMemberships.userId, latestRun.userId)
            )
          ),
      ]);

      if (updatedUser) {
        const nextEarnedTier = getRankInfo(updatedUser.careerXp).artTier;
        if (updatedUser.claimedArtTier > nextEarnedTier) {
          await db
            .update(users)
            .set({ claimedArtTier: nextEarnedTier })
            .where(eq(users.id, latestRun.userId));
        }
      }
    }

    const [fortState, session] = await Promise.all([
      buildFortState(task.fortId),
      buildSessionPayload(auth.userId),
    ]);

    return Response.json({ fortState, session });
  } catch (error) {
    return handleApiError(error);
  }
}
