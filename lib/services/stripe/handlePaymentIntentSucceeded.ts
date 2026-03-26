import Stripe from 'stripe';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const reservationId = Number(paymentIntent.metadata?.reservationId);

  if (!reservationId || Number.isNaN(reservationId)) {
    return;
  }

  const reservation = await ReservationRepository.findById(reservationId);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  await ReservationRepository.update(reservationId, {
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
  });
}
