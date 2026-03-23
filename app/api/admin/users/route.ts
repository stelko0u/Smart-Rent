import { NextRequest, NextResponse } from 'next/server';
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import { UserRepository } from '@/lib/repository/UserRepository';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { deleteUserDeep } from '@/lib/services/admin/deleteEntity';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7).trim();
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(
    new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function requireAdmin(req: Request) {
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

// GET - Извличане на всички потребители
export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const users = await UserRepository.findMany();
    // Премахване на password полето от резултата
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json({ ok: true, users: sanitizedUsers });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

// DELETE - Изтриване на потребител
export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    await deleteUserDeep(Number(id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/users error:', err);

    const message = err instanceof Error ? err.message : 'delete_error';

    if (message === 'user_not_found') {
      return NextResponse.json(
        { ok: false, error: 'user_not_found' },
        { status: 404 },
      );
    }

    if (message === 'cannot_delete_admin') {
      return NextResponse.json(
        { ok: false, error: 'cannot_delete_admin' },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
// PATCH - Ban/Unban потребител
export async function PATCH(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { ok: false, error: 'id_and_action_required' },
        { status: 400 },
      );
    }

    const user = await UserRepository.findById(Number(id));
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'user_not_found' },
        { status: 404 },
      );
    }

    // Не позволявай ban на ADMIN потребители
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'cannot_ban_admin' },
        { status: 403 },
      );
    }

    let updatedUser;
    if (action === 'ban') {
      updatedUser = await UserRepository.ban(Number(id), reason);
    } else if (action === 'unban') {
      updatedUser = await UserRepository.unban(Number(id));
    } else {
      return NextResponse.json(
        { ok: false, error: 'invalid_action' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (err) {
    console.error('PATCH /api/admin/users error:', err);
    return NextResponse.json(
      { ok: false, error: 'update_error' },
      { status: 500 },
    );
  }
}
