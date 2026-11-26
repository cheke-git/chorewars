import { handleApiError, requireAuth } from '@/server/auth';
import { buildFortState, requireFortByAccountId } from '@/server/fortState';

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const fort = await requireFortByAccountId(session.accountId);
    const state = await buildFortState(fort.id);
    return Response.json(state);
  } catch (error) {
    return handleApiError(error);
  }
}
