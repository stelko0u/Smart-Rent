import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { FavoriteRepository } from '@/lib/repository/FavoriteRepository';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const favorites = await query(
      `SELECT c.* FROM "Favorite" f
       JOIN "Car" c ON f."carId" = c.id
       WHERE f."userId" = $1
       ORDER BY f."createdAt" DESC`,
      [user.id],
    );

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

    const body = await req.json();
    const { carId } = body;

    if (!carId) {
      return NextResponse.json(
        { ok: false, error: 'Car ID is required' },
        { status: 400 },
      );
    }

    const favorite = await FavoriteRepository.create(user.id, Number(carId));

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
