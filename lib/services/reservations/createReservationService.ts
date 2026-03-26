import { CarRepository } from '@/lib/repository/CarRepository';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { sendReservationPaymentEmail } from '@/lib/mail/sendReservationPaymentEmail';
import {
  calculateReservationPricing,
  getReservationDateRangeOrThrow,
} from '@/lib/services/reservations/reservationPricing';

type Input = {
  user: {
    id: number;
    name?: string | null;
    email?: string | null;
  };
  body: {
    carId?: number;
    startDate?: string;
    endDate?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    paymentMethod?: 'CARD' | 'ON_SPOT';
  };
};

export async function createReservation({ user, body }: Input) {
  const {
    carId,
    startDate,
    endDate,
    firstName,
    lastName,
    email,
    phone,
    paymentMethod,
  } = body;

  if (!carId || !startDate || !endDate) {
    throw new Error('MISSING_REQUIRED_FIELDS');
  }

  const normalizedPaymentMethod =
    paymentMethod === 'ON_SPOT' ? 'ON_SPOT' : 'CARD';

  const car = await CarRepository.findById(Number(carId));

  if (!car) {
    throw new Error('CAR_NOT_FOUND');
  }

  const { start, end } = getReservationDateRangeOrThrow(startDate, endDate);

  const conflictingReservations = await ReservationRepository.findConflicting(
    Number(carId),
    start,
    end,
  );

  if (conflictingReservations.length > 0) {
    throw new Error('DATES_NOT_AVAILABLE');
  }

  const { days, totalPrice } = calculateReservationPricing(
    start,
    end,
    car.pricePerDay,
  );

  const reservation = await ReservationRepository.create({
    userId: user.id,
    carId: Number(carId),
    startDate: start,
    endDate: end,
    totalPrice,
    firstName: firstName || user.name || '',
    lastName: lastName || user.name || '',
    email: email || user.email || '',
    phone: phone || '',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: normalizedPaymentMethod,
  });

  let emailSent = false;

  if (normalizedPaymentMethod === 'CARD') {
    try {
      await sendReservationPaymentEmail(
        {
          id: reservation.id,
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          totalPrice: reservation.totalPrice,
          paymentMethod: reservation.paymentMethod,
        },
        {
          make: car.make,
          model: car.model,
          year: car.year,
          pricePerDay: car.pricePerDay,
        },
      );

      emailSent = true;
    } catch (mailError) {
      console.error(
        `Failed to send reservation payment email for reservation #${reservation.id}:`,
        mailError,
      );
    }
  }

  return {
    ok: true,
    reservation: {
      ...reservation,
      car: {
        make: car.make,
        model: car.model,
        pricePerDay: car.pricePerDay,
      },
      days,
    },
    flow: {
      paymentMethod: normalizedPaymentMethod,
      emailSent,
      nextStep:
        normalizedPaymentMethod === 'CARD'
          ? emailSent
            ? 'CHECK_EMAIL'
            : 'PAYMENT_PAGE'
          : 'RESERVATION_CREATED',
    },
  };
}
