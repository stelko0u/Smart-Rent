import { cookies } from 'next/headers';
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { UserRepository } from './repositories';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function extractTokenFromCookieHeader(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(
    new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );

  return match ? decodeURIComponent(match[2]) : null;
}

function extractTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }

  return extractTokenFromCookieHeader(req.headers.get('cookie'));
}

async function getUserFromToken(token: string) {
  if (!JWT_SECRET) {
    throw new AuthError('server_misconfigured', 500);
  }

  let payload: JwtPayload | Record<string, any>;

  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload | Record<string, any>;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AuthError('token_expired', 401);
    }
    if (err instanceof JsonWebTokenError) {
      throw new AuthError('invalid_token', 401);
    }
    throw err;
  }

  const userId = Number((payload as any).userId ?? payload.sub ?? null);

  if (!userId || Number.isNaN(userId)) {
    throw new AuthError('invalid_token', 401);
  }

  const user = await UserRepository.findById(userId);

  if (!user) {
    throw new AuthError('user_not_found', 404);
  }

  return user;
}

//  За Route Handlers: app/api/**/route.ts
export async function requireAuthUserFromRequest(req: Request) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    throw new AuthError('no_token', 401);
  }

  return getUserFromToken(token);
}

/**
 * За Server Components / server-side код с cookies()
 * Връща null вместо да хвърля грешка
 */
export async function getAuthUser() {
  try {
    if (!JWT_SECRET) {
      return null;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return await getUserFromToken(token);
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}

export async function getMe() {
  try {
    const all = (await cookies()).getAll();
    const tokenCookieName =
      process.env.AUTH_COOKIE_NAME ??
      process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ??
      'token';
    const named = (await cookies()).get(tokenCookieName);
    const cookieHeader = named
      ? `${named.name}=${named.value}`
      : all.map((c) => `${c.name}=${c.value}`).join('; ');

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    const url = new URL('/api/auth/me', base).toString();

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { cookie: cookieHeader, Accept: 'application/json' },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json?.ok && json.user) return json.user;
    return null;
  } catch (err) {
    console.error('getMe error:', err);
    return null;
  }
}
