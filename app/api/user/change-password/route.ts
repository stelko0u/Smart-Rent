import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserRepository } from '@/lib/repository/UserRepository';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: 'Current password and new password are required' },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'New password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Current password is incorrect' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserRepository.update(user.id, {
      password: hashedPassword,
    });

    return NextResponse.json({
      ok: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('POST /api/user/change-password error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
