import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { FavoriteRepository } from '@/lib/repository/FavoriteRepository';

interface FavoriteDeleteRouteContext {
  params: Promise<{
    id: string;
  }>;
}

function parseCarId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export async function DELETE(
  req: Request,
  { params }: FavoriteDeleteRouteContext,
) {
  try {
    const user = await requireAuthUserFromRequest(req);
    const { id } = await params;
    const carId = parseCarId(id);

    if (!carId) {
      return NextResponse.json(
        { ok: false, error: 'Invalid car ID' },
        { status: 400 },
      );
    }

    const deleted = await FavoriteRepository.delete(user.id, carId);

    return NextResponse.json({
      ok: true,
      deleted,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('DELETE /api/user/favorites/[id] error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
