import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/lib/repository/UserRepository';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let payload: { userId?: number | string; type?: string };

    try {
      payload = jwt.verify(token, jwtSecret) as {
        userId?: number | string;
        type?: string;
      };
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    if (payload?.type !== 'verify-email' || !payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const userId = Number(payload.userId);

    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user id in token' },
        { status: 400 },
      );
    }

    const user = await UserRepository.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerified) {
      await UserRepository.update(userId, { emailVerified: true });
    }

    const frontend =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.SITE_URL ??
      'http://localhost:3000';

    return NextResponse.redirect(`${frontend}/signin?verified=1`);
  } catch (err: unknown) {
    console.error('GET /api/auth/verify error:', err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Server error',
      },
      { status: 500 },
    );
  }
}
