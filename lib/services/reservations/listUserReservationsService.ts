import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';

export async function listUserReservations(userId: number) {
  await processCompletedReservationsForReviewEmails({ userId });

  const reservations = await ReservationRepository.findByUser(userId);

  return {
    ok: true,
    reservations,
  };
}
