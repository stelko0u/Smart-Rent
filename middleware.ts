import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

type SessionPayload = {
  id: number;
  email: string;
  role: 'ADMIN' | 'COMPANY' | 'USER';
  mustChangePassword?: boolean;
  companyId?: number | null;
};

const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/review',
];

const PUBLIC_PATH_PREFIXES = [
  '/_next',
  '/favicon',
  '/images',
  '/uploads',
  '/car', // важно: за /car/[id]
];

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/cars',
  '/api/offices',
  '/api/reviews',
  '/api/cron/process-review-emails',
  '/api/dev/test-review-email',
  '/api/reviews',
  '/api/review-link',
  '/api/cron/review-reminders',
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return null;
  }

  const secretValue = process.env.JWT_SECRET;
  if (!secretValue) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch (err) {
    console.error('Invalid session token:', err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await readSession(req);

  if (!session) {
    // if (pathname.startsWith('/api/')) {
    //   return NextResponse.json(
    //     { ok: false, error: 'Unauthorized' },
    //     { status: 401 },
    //   );
    // }

    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set(
      'callbackUrl',
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }

  if (
    session.mustChangePassword &&
    pathname !== '/change-temporary-password' &&
    !pathname.startsWith('/api/auth/change-password')
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'password_change_required' },
        { status: 403 },
      );
    }

    const url = req.nextUrl.clone();
    url.pathname = '/change-temporary-password';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (
    pathname.startsWith('/company') &&
    session.role !== 'COMPANY' &&
    session.role !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
