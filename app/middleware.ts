import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
    console.error('middleware /admin auth error:', err);
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
