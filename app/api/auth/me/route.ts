import { NextResponse } from 'next/server';
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { UserRepository } from '@/lib/repository/UserRepository';
import { getTokenFromRequest } from '@/lib/auth/getTokenFromRequest';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: Request) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'server_misconfigured' },
      { status: 500 },
    );
  }

  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'no_token' },
        { status: 401 },
      );
    }

    const payload = jwt.verify(token, JWT_SECRET) as
      | JwtPayload
      | Record<string, any>;

    const userId = Number((payload as any).userId ?? payload.sub ?? null);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 401 },
      );
    }

    const user = await UserRepository.findById(userId);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'user_not_found' },
        { status: 404 },
      );
    }
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return NextResponse.json(
        { ok: false, error: 'token_expired' },
        { status: 401 },
      );
    }
    if (err instanceof JsonWebTokenError) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 401 },
      );
    }
    console.error('GET /api/auth/me error:', err);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}
