import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

type Input = {
  reservationId: number;
  reason?: string | null;
};

export async function markPaymentFailed({ reservationId, reason }: Input) {
  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error('MISSING_RESERVATION_ID');
  }

  const reservation = await ReservationRepository.findById(reservationId);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  const payment = await PaymentsRepository.findByReservation(reservationId);

  if (payment) {
    await PaymentsRepository.update(payment.id, {
      paymentStatus: 'FAILED',
    });
  }

  await ReservationRepository.update(reservationId, {
    status: 'CANCELLED',
  });

  return {
    ok: true,
    message: 'Payment marked as failed',
    reservationId,
    reason: reason || null,
  };
}
