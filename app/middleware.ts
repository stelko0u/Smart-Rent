import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

// Paths that banned users ARE allowed to access
const ALLOWED_BANNED_PATHS = [
  '/api/auth/signout',
  '/api/auth/me',
  '/signin',
  '/signup',
  '/banned',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * ---------------------------
   * Skip public/static paths
   * ---------------------------
   */
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    ALLOWED_BANNED_PATHS.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  /**
   * ---------------------------
   * JWT / banned user check
   * ---------------------------
   */
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token && JWT_SECRET) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;

      if (payload?.banned) {
        return NextResponse.redirect(new URL('/banned', req.url));
      }
    } catch {
      // Invalid token → ignore and continue
    }
  }

  /**
   * ---------------------------
   * Admin route protection
   * ---------------------------
   */
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  try {
    const url = new URL('/api/auth/me', req.nextUrl.origin);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ ok: false, error: 'forbidden' }),
          {
            status: 403,
            headers: { 'content-type': 'application/json' },
          },
        );
      }
      return NextResponse.redirect(new URL('/signin', req.nextUrl.origin));
    }

    const json = await res.json().catch(() => ({}));
    const user = json?.user ?? null;

    if (!user || user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ ok: false, error: 'forbidden' }),
          {
            status: 403,
            headers: { 'content-type': 'application/json' },
          },
        );
      }
      return NextResponse.redirect(new URL('/signin', req.nextUrl.origin));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('middleware auth error:', err);

    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: 'internal_error' }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    return NextResponse.redirect(new URL('/signin', req.nextUrl.origin));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
