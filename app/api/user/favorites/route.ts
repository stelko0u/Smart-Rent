import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { query } from '@/lib/db';
import { UserRepository } from '@/lib/repositories/userRepository';
import { FavoriteRepository } from '@/lib/repositories/FavoriteRepository';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7).trim();
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(
    new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function getUserFromToken(req: Request) {
  if (!JWT_SECRET) return null;
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = Number(payload.userId ?? payload.sub);
    if (!userId || isNaN(userId)) return null;

    const user = await UserRepository.findById(userId);
    return user;
  } catch (err) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get favorites with car details using JOIN
    const favorites = await query(
      `SELECT c.* FROM "Favorite" f
       JOIN "Car" c ON f."carId" = c.id
       WHERE f."userId" = $1
       ORDER BY f."createdAt" DESC`,
      [user.id],
    );

    return NextResponse.json({ ok: true, favorites });
  } catch (err) {
    console.error('GET /api/user/favorites error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { carId } = body;

    if (!carId) {
      return NextResponse.json(
        { ok: false, error: 'Car ID is required' },
        { status: 400 },
      );
    }

    const favorite = await FavoriteRepository.create(user.id, Number(carId));

    return NextResponse.json({ ok: true, favorite });
  } catch (err) {
    console.error('POST /api/user/favorites error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const carId = Number(params.id);
    if (!carId || isNaN(carId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid car ID' },
        { status: 400 },
      );
    }

    const deleted = await FavoriteRepository.delete(user.id, carId);

    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: 'Favorite not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, message: 'Favorite removed' });
  } catch (err) {
    console.error('DELETE /api/user/favorites/[id] error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
