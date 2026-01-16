import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const origin =
      req.nextUrl?.origin ??
      `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get(
        'host'
      )}`;

    const meRes = await fetch(`${origin}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = meRes.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      console.error('/api/auth/me returned non-json:', await meRes.text());
      return NextResponse.json(
        { error: 'Unexpected auth response' },
        { status: 500 }
      );
    }
    const data = await meRes.json();

    const rawRole = data?.role ?? data?.user?.role ?? data?.user?.type ?? null;
    const role =
      typeof rawRole === 'string' ? rawRole.toLowerCase().trim() : null;
    if (role !== 'company')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const companyId = data?.company?.id ?? data?.user?.companyId ?? null;
    const companyName =
      data?.company?.name ??
      data?.user?.companyName ??
      data?.user?.name ??
      null;

    return NextResponse.json({ company: { id: companyId, name: companyName } });
  } catch (err) {
    console.error('company/me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
