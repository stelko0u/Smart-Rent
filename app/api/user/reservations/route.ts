import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CarRepository } from '@/lib/repository/CarRepository';

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const requestedLimit = parsePositiveInteger(searchParams.get('limit'), 3);
    const limit = Math.min(requestedLimit, 50);

    const totalItems = await ReservationRepository.countByUser(user.id);
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;

    const reservations = await ReservationRepository.findByUserPaginated(
      user.id,
      limit,
      offset,
    );

    const reservationsWithCars = await Promise.all(
      reservations.map(async (reservation) => {
        const car = await CarRepository.findById(reservation.carId);

        return {
          ...reservation,
          car,
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      reservations: reservationsWithCars,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/user/reservations error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
