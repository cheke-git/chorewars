import { z } from 'zod';

import { HttpError, handleApiError, requireAuth, verifySecret } from '@/server/auth';
import { requireFortByAccountId } from '@/server/fortState';

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits.'),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);

    const body = await request.json();
    const parsed = pinSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError('Enter a 4-digit CoCh PIN.', 400);
    }

    const valid = verifySecret(parsed.data.pin, fort.cochPinHash);
    if (!valid) {
      throw new HttpError('Incorrect CoCh PIN.', 403);
    }

    return Response.json({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}
