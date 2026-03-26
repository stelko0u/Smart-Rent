import { ReservationRepository } from "@/lib/repository/ReservationRepository";


export async function getUserReservationDetails(
  reservationId: number,
  userId: number,
) {
  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error('INVALID_RESERVATION_ID');
  }

  const reservations = await ReservationRepository.findReservationDetailsByIdAndUserId(
    reservationId,
    userId,
  );

  if (reservations.length === 0) {
    const anyReservation = await ReservationRepository.findReservationOwnerById(reservationId);

    if (anyReservation.length > 0) {
      console.log(
        '⚠️ Reservation exists but belongs to user:',
        anyReservation[0].userId,
        'not',
        userId,
      );
    } else {
      console.log('⚠️ Reservation does not exist in database');
    }

    throw new Error('RESERVATION_NOT_FOUND');
  }

  const reservation = reservations[0];

  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);

  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const pricePerDay = Number(reservation.pricePerDay || 0);
  const totalAmount = days * pricePerDay;

  return {
    reservation: {
      id: reservation.id,
      carMake: reservation.carMake,
      carModel: reservation.carModel,
      carImage: reservation.carImages?.[0] || null,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      days,
      pricePerDay,
      totalAmount,
      status: reservation.status,
      paymentMethod: reservation.paymentMethod,
    },
  };
}
