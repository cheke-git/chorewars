import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, handleApiError, hashSecret, requireAuth, verifySecret } from '@/server/auth';
import { buildSessionPayload } from '@/server/fortState';

const updateMeSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty.').max(40).optional(),
  avatarKey: z.string().min(1).optional(),
  isAdult: z.boolean().optional(),
  currentPin: z
    .string()
    .regex(/^\d{4}$/, 'Current PIN must be 4 digits.')
    .optional(),
  guardianPin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = updateMeSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid profile update.', 400);
    }

    const db = getDb();
    const updates: Partial<typeof users.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.avatarKey !== undefined) updates.avatarKey = parsed.data.avatarKey;
    if (parsed.data.isAdult !== undefined) updates.isAdult = parsed.data.isAdult;

    if (parsed.data.guardianPin !== undefined) {
      const [existing] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
      if (existing?.guardianPinHash) {
        if (
          !parsed.data.currentPin ||
          !verifySecret(parsed.data.currentPin, existing.guardianPinHash)
        ) {
          throw new HttpError('Current Guardian PIN is required to change your PIN.', 403);
        }
      }
      updates.guardianPinHash = hashSecret(parsed.data.guardianPin);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, auth.userId));
    }

    const session = await buildSessionPayload(auth.userId);
    return Response.json(session);
  } catch (error) {
    return handleApiError(error);
  }
}
