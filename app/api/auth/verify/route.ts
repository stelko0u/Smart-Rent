import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userService } from '../../../lib/api';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!token || !JWT_SECRET) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
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

const user = await userService.getById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerified) {
      await userService.update(userId, { emailVerified: true });
    }

    const frontend = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const redirectUrl = `${frontend}/signin?verified=1`;
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('GET /api/auth/verify error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 },
    );
  }
}
