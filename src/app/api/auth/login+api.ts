import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, handleApiError, signAuthToken, verifySecret } from '@/server/auth';
import { buildSessionPayload } from '@/server/fortState';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid login credentials.', 400);
    }

    const email = parsed.data.email.toLowerCase();
    const db = getDb();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.passwordHash || !verifySecret(parsed.data.password, user.passwordHash)) {
      throw new HttpError('Invalid email or password.', 401);
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email ?? email,
    });

    const session = await buildSessionPayload(user.id);

    return Response.json({
      token,
      session,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
