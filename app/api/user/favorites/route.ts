import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { FavoriteRepository } from '@/lib/repository/FavoriteRepository';

function getCarIdFromBody(body: unknown): number | null {
  if (typeof body !== 'object' || body === null || !('carId' in body)) {
    return null;
  }

  const value = body.carId;

  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);
    const favorites = await FavoriteRepository.findCarsByUser(user.id);

    return NextResponse.json({
      ok: true,
      favorites,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/user/favorites error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);
    const body = (await req.json()) as unknown;
    const carId = getCarIdFromBody(body);

    if (!carId) {
      return NextResponse.json(
        { ok: false, error: 'Valid car ID is required' },
        { status: 400 },
      );
    }

    const favorite = await FavoriteRepository.create(user.id, carId);

    return NextResponse.json({
      ok: true,
      favorite,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('POST /api/user/favorites error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
