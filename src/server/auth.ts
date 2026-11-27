import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

export interface AuthSession {
  userId: string;
  email: string;
}

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function hashSecret(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifySecret(plain: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) {
    return false;
  }
  const derived = scryptSync(plain, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) {
    return false;
  }
  return timingSafeEqual(derived, keyBuf);
}

const INVITE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateInviteCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return code;
}

function getJwtKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new HttpError('JWT_SECRET is not configured on the server.', 500);
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(session: AuthSession): Promise<string> {
  return new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtKey());
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey());
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<AuthSession> {
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError('Authentication required.', 401);
  }
  const session = await verifyAuthToken(match[1].trim());
  if (!session) {
    throw new HttpError('Session expired or invalid. Please log in again.', 401);
  }
  return session;
}

export function extractRouteParam(
  request: Request,
  params: Record<string, string> | undefined,
  key: string,
  pattern: RegExp
): string {
  if (params?.[key]) {
    return params[key];
  }
  const match = new URL(request.url).pathname.match(pattern);
  if (!match?.[1]) {
    throw new HttpError(`Missing ${key} parameter.`, 400);
  }
  return match[1];
}

export function handleApiError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('[API Error]', error);
  return Response.json({ error: message }, { status: 500 });
}
