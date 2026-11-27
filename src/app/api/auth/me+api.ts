import { handleApiError, requireAuth } from '@/server/auth';
import { buildSessionPayload } from '@/server/fortState';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const session = await buildSessionPayload(auth.userId);
    return Response.json(session);
  } catch (error) {
    return handleApiError(error);
  }
}
