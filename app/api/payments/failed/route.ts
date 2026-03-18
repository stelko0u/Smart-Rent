import { PaymentsRepository } from '@/lib/repositories/PaymentsRepository';
import { ReservationRepository } from '@/lib/repositories/ReservationRepository';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {
    const { reservationId, reason } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing reservation ID' },
        { status: 400 },
      );
    }

    // Find existing payment
    const payment = await PaymentsRepository.findByReservation(reservationId);

    if (payment) {
      // Update payment to FAILED
      await PaymentsRepository.update(payment.id, {
        paymentStatus: 'FAILED',
      });
    }

    // Update reservation to CANCELLED
    await ReservationRepository.update(reservationId, {
      status: 'CANCELLED',
    });

    return NextResponse.json({
      ok: true,
      message: 'Payment marked as failed',
    });
  } catch (err) {
    console.error('POST /api/payments/failed error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Server error',
        details:
          process.env.NODE_ENV === 'development'
            ? (err as Error)?.message
            : undefined,
      },
      { status: 500 },
    );
  }
}
