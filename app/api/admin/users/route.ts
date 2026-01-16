import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const origin =
      req.nextUrl?.origin ??
      `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;

    const meRes = await fetch(`${origin}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!meRes.ok) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await meRes.json();

    const rawRole =
      data?.role ??
      data?.user?.role ??
      data?.data?.role ??
      data?.user?.profile?.role ??
      data?.user?.type ??
      null;

    const role =
      typeof rawRole === 'string' ? rawRole.toLowerCase().trim() : null;

    if (!role || role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('admin/users error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
