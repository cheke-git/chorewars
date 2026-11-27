import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb, users } from '@/db';
import { HttpError, handleApiError, hashSecret, signAuthToken } from '@/server/auth';
import { buildSessionPayload } from '@/server/fortState';

const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().trim().min(1).max(40).optional(),
  avatarKey: z.string().min(1).optional(),
  guardianPin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be 4 digits.')
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(parsed.error.issues[0]?.message ?? 'Invalid registration data.', 400);
    }

    const email = parsed.data.email.toLowerCase();
    const fallbackName = email.split('@')[0]?.slice(0, 30) || 'Commander';
    const db = getDb();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new HttpError('An account with this email already exists.', 409);
    }

    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashSecret(parsed.data.password),
        guardianPinHash: parsed.data.guardianPin ? hashSecret(parsed.data.guardianPin) : null,
        name: parsed.data.name?.trim() || fallbackName,
        isAdult: true,
        avatarKey: parsed.data.avatarKey ?? 'parent-male',
      })
      .returning({ id: users.id, email: users.email });

    const token = await signAuthToken({
      userId: created.id,
      email: created.email ?? email,
    });

    const session = await buildSessionPayload(created.id);

    return Response.json(
      {
        token,
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
