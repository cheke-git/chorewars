import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, handleApiError, requireAuth, verifySecret } from '@/server/auth';

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits.'),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const parsed = pinSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Enter a 4-digit PIN.', 400);
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) {
      throw new HttpError('Account not found.', 404);
    }

    if (!user.guardianPinHash) {
      return Response.json({ valid: true, noPinConfigured: true });
    }

    if (!verifySecret(parsed.data.pin, user.guardianPinHash)) {
      throw new HttpError('Incorrect Guardian PIN.', 403);
    }

    return Response.json({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}
