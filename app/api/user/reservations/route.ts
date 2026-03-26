import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CarRepository } from '@/lib/repository/CarRepository';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const reservations = await ReservationRepository.findByUser(user.id);

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
