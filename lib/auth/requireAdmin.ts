import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { UserRepository } from '../repository/UserRepository';
import { getTokenFromRequest } from './getTokenFromRequest';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

export async function requireAdmin(req: Request) {
  if (!JWT_SECRET)
    return {
      ok: false,
      resp: NextResponse.json(
        { error: 'server_misconfigured' },
        { status: 500 },
      ),
    };
  const token = getTokenFromRequest(req);
  if (!token)
    return {
      ok: false,
      resp: NextResponse.json({ error: 'no_token' }, { status: 401 }),
    };
  try {
    const payload = jwt.verify(token, JWT_SECRET) as
      | JwtPayload
      | Record<string, any>;
    const userId = Number((payload as any).userId ?? payload.sub ?? null);
    if (!userId || Number.isNaN(userId))
      return {
        ok: false,
        resp: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
      };

    const user = await UserRepository.findById(userId);
    if (!user)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'user_not_found' }, { status: 404 }),
      };
    if (user.role !== 'ADMIN')
      return {
        ok: false,
        resp: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
      };
    return { ok: true, user };
  } catch (err) {
    if (err instanceof TokenExpiredError)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'token_expired' }, { status: 401 }),
      };
    if (err instanceof JsonWebTokenError)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
      };
    console.error('requireAdmin error:', err);
    return {
      ok: false,
      resp: NextResponse.json({ error: 'internal_error' }, { status: 500 }),
    };
  }
}
