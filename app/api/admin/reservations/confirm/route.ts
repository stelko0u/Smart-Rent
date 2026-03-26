import { NextResponse } from 'next/server';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { requireAdmin } from '@/lib/auth/requireAdmin';


const sendReservationEmail = async (to: string, reservationDetails: any) => {
  console.log('Sending reservation email to:', to);
  console.log('Reservation details:', reservationDetails);
  return Promise.resolve();
};

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();

    if (!body?.reservationId) {
      return NextResponse.json(
        { ok: false, error: 'reservationId_required' },
        { status: 400 },
      );
    }

    const reservation = (await ReservationRepository.findById(
      Number(body.reservationId),
    )) as any;

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'reservation_not_found' },
        { status: 404 },
      );
    }

    if (reservation.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: 'cannot_confirm_cancelled_reservation' },
        { status: 400 },
      );
    }

    const updatedReservation = await ReservationRepository.updateStatus(
      reservation.id,
      'CONFIRMED',
    );

    await sendReservationEmail(reservation.user_email, {
      ...reservation,
      carDetails: {
        make: reservation.car_make,
        model: reservation.car_model,
        pricePerDay: reservation.car_price,
      },
    });

    return NextResponse.json({
      ok: true,
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('POST /api/admin/reservations/confirm error:', error);
    return NextResponse.json(
      { ok: false, error: 'failed_to_confirm_reservation' },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const url = new URL(req.url);
    const reservationId = url.searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        { ok: false, error: 'reservation_id_required' },
        { status: 400 },
      );
    }

    const reservation = (await ReservationRepository.findById(
      Number(reservationId),
    )) as any;

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'reservation_not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    console.error('GET /api/admin/reservations/confirm error:', error);
    return NextResponse.json(
      { ok: false, error: 'failed_to_fetch_reservation' },
      { status: 500 },
    );
  }
}
