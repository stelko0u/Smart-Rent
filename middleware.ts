import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

type SessionPayload = {
  id?: number;
  userId?: number;
  email: string;
  role: 'ADMIN' | 'COMPANY' | 'USER';
  mustChangePassword?: boolean;
  companyId?: number | null;
  banned?: boolean;
};

const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/review',
  '/banned',
];

const PUBLIC_API_PREFIXES = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/auth/verify-reset-token',
  '/api/auth/resend-verification',
  '/api/auth/complete-onboarding',
  '/api/cars',
  '/api/offices',
  '/api/reviews',
  '/api/cron/process-review-emails',
  '/api/dev/test-review-email',
  '/api/review-link',
  '/api/cron/review-reminders',
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/car/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  const secretValue = process.env.JWT_SECRET;
  if (!secretValue) return null;

  try {
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch (err) {
    console.error('Invalid session token:', err);
    return null;
  }
}

function withLocaleCookie(req: NextRequest, res: NextResponse) {
  const locale = req.cookies.get('locale')?.value;

  if (locale !== 'bg' && locale !== 'en') {
    res.cookies.set('locale', 'bg', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  // Баннат user: само /banned и signout
  if (session?.banned) {
    const allowedForBanned =
      pathname === '/banned' ||
      pathname.startsWith('/api/auth/signout') ||
      pathname.startsWith('/api/auth/me') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/uploads');

    if (!allowedForBanned) {
      if (pathname.startsWith('/api/')) {
        return withLocaleCookie(
          req,
          NextResponse.json(
            { ok: false, error: 'account_banned' },
            { status: 403 },
          ),
        );
      }

      const url = req.nextUrl.clone();
      url.pathname = '/banned';
      url.search = '';
      return withLocaleCookie(req, NextResponse.redirect(url));
    }

    return withLocaleCookie(req, NextResponse.next());
  }

  if (isPublicPath(pathname)) {
    return withLocaleCookie(req, NextResponse.next());
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set(
      'callbackUrl',
      req.nextUrl.pathname + req.nextUrl.search,
    );

    return withLocaleCookie(req, NextResponse.redirect(url));
  }

  if (
    session.mustChangePassword &&
    pathname !== '/change-temporary-password' &&
    !pathname.startsWith('/api/auth/change-password')
  ) {
    if (pathname.startsWith('/api/')) {
      return withLocaleCookie(
        req,
        NextResponse.json(
          { ok: false, error: 'password_change_required' },
          { status: 403 },
        ),
      );
    }

    const url = req.nextUrl.clone();
    url.pathname = '/change-temporary-password';
    return withLocaleCookie(req, NextResponse.redirect(url));
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return withLocaleCookie(req, NextResponse.redirect(new URL('/', req.url)));
  }

  if (
    pathname.startsWith('/company') &&
    session.role !== 'COMPANY' &&
    session.role !== 'ADMIN'
  ) {
    return withLocaleCookie(req, NextResponse.redirect(new URL('/', req.url)));
  }

  return withLocaleCookie(req, NextResponse.next());
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
