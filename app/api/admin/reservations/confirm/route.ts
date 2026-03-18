import { NextResponse } from 'next/server';
import { reservationService } from '../../../../../lib/api';
import { sendVerificationEmail } from '../../../../../lib/mail';

// Mock email sending for now - replace with real email service
const sendReservationEmail = async (to: string, reservationDetails: any) => {
  console.log('Sending reservation email to:', to);
  console.log('Reservation details:', reservationDetails);
  // TODO: Implement actual email sending
  return Promise.resolve();
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reservation = (await reservationService.getById(
      body.reservationId,
    )) as any;

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }

    if (reservation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot confirm a cancelled reservation' },
        { status: 400 },
      );
    }

    // Update reservation status to CONFIRMED
    const updatedReservation = await reservationService.updateStatus(
      reservation.id,
      'CONFIRMED',
    );

    // Send confirmation email
    await sendReservationEmail(reservation.user_email, {
      ...reservation,
      carDetails: {
        make: reservation.car_make,
        model: reservation.car_model,
        pricePerDay: reservation.car_price,
      },
    });

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('POST /api/admin/reservations/confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm reservation' },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reservationId = url.searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 },
      );
    }

    const reservation = (await reservationService.getById(
      Number(reservationId),
    )) as any;

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }
}
