import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/lib/repository/UserRepository';

export const runtime = 'nodejs';

type ReqBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';
const JWT_SECRET = process.env.JWT_SECRET;

function normalizeRole(role: unknown): 'USER' | 'ADMIN' | 'COMPANY' | null {
  if (typeof role !== 'string') return null;

  const value = role.trim().toUpperCase();

  if (value === 'USER' || value === 'ADMIN' || value === 'COMPANY') {
    return value;
  }

  if (value === 'MANAGER') {
    return 'COMPANY';
  }

  return null;
}

function getRedirectByUser(user: {
  banned?: boolean;
  role: 'USER' | 'ADMIN' | 'COMPANY' | null;
}) {
  console.log('Determining redirect for user:', user.banned, user.role);
  if (user.banned) return '/banned';

  switch (user.role) {
    case 'ADMIN':
    case 'COMPANY':
    case 'USER':
      return '/';
    default:
      return '/';
  }
}

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
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const user = await UserRepository.findByEmail(email);

    if (user?.mustChangePassword) {
      return NextResponse.json(
        {
          mustChangePassword: true,
          redirectTo: `/change-temporary-password?userId=${user.id}`,
        },
        { status: 403 },
      );
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified. Please check your mailbox.',
        },
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

    const normalizedRole = normalizeRole(user.role);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: normalizedRole,
        companyId: user.companyId ?? null,
        banned: Boolean(user.banned),
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
        subject: String(user.id),
      },
    );

    const res = NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: normalizedRole,
          companyId: user.companyId ?? null,
          banned: Boolean(user.banned),
          banReason: user.banReason ?? null,
          bannedAt: user.bannedAt ?? null,
        },
        redirectTo: getRedirectByUser({
          banned: Boolean(user.banned),
          role: normalizedRole,
        }),
      },
      { status: 200 },
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    console.error('POST /api/auth/signin error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
