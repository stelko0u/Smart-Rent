import { ReservationRepository } from '@/lib/repositories/ReservationRepository';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params; // ✅ await тук
    const carId = Number(id);

    if (!carId || isNaN(carId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid car ID' },
        { status: 400 },
      );
    }

    const reservations = await ReservationRepository.findByCar(carId);

    const activeReservations = reservations.filter(
      (r) => r.status !== 'CANCELLED',
    );

    return NextResponse.json({
      ok: true,
      reservations: activeReservations.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('GET /api/cars/[id]/reservations error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
