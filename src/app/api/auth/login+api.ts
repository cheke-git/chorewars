import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { accounts, getDb } from '@/db';
import { HttpError, handleApiError, signAuthToken, verifySecret } from '@/server/auth';
import { getFortByAccountId } from '@/server/fortState';

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

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (!account || !verifySecret(parsed.data.password, account.passwordHash)) {
      throw new HttpError('Invalid email or password.', 401);
    }

    const fort = await getFortByAccountId(account.id);
    const token = await signAuthToken({
      accountId: account.id,
      email: account.email,
    });

    return Response.json({
      token,
      account: { id: account.id, email: account.email },
      hasFort: Boolean(fort),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
