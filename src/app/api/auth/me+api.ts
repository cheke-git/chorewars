import { handleApiError, requireAuth } from '@/server/auth';
import { getFortByAccountId } from '@/server/fortState';

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await getFortByAccountId(session.accountId);

    return Response.json({
      account: { id: session.accountId, email: session.email },
      hasFort: Boolean(fort),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
