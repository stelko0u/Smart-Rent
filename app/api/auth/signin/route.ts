import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/lib/repositories/userRepository';

export const runtime = 'nodejs';

type ReqBody = {
  email?: string;
  password?: string;
};

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET missing');
      return NextResponse.json(
        { error: 'server misconfigured' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as ReqBody;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const user = await UserRepository.findByEmail(String(email).toLowerCase());

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      return new Response(
        JSON.stringify({
          error: 'Email not verified. Please check your mailbox.',
        }),
        { status: 403 },
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
      subject: String(user.id),
    });

    const res = NextResponse.json(
      {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name ?? null },
      },
      { status: 200 },
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('POST /api/auth/signin error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 },
    );
  }
}
