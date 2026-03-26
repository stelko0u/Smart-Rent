import { CarRepository } from '@/lib/repository/CarRepository';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

export async function getReservationCarCompanyForPaymentOrThrow(
  reservationId: number,
) {
  const reservation = await ReservationRepository.findById(reservationId);

  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  const car = await CarRepository.findById(reservation.carId);

  if (!car) {
    throw new Error('CAR_NOT_FOUND');
  }

  if (!car.companyId) {
    throw new Error('CAR_HAS_NO_COMPANY');
  }

  const company = await CompanyRepository.findById(Number(car.companyId));

  if (!company) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  if (!company.stripeAccountId) {
    const error = new Error('COMPANY_HAS_NO_STRIPE_ACCOUNT');
    (error as any).company = {
      id: company.id,
      name: company.name,
    };
    throw error;
  }

  return {
    reservation,
    car,
    company,
  };
}
