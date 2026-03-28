import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repository/UserRepository';
import { deleteUserDeep } from '@/lib/services/admin/deleteEntity';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const users = await UserRepository.findMany();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json({ ok: true, users: sanitizedUsers });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

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
