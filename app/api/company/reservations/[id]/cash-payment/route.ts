import { NextResponse } from 'next/server';
import { requireCompanyUser } from '@/lib/auth/requireCompany';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CarRepository } from '@/lib/repository/CarRepository';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';

interface CashPaymentRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(req: Request, { params }: CashPaymentRouteContext) {
  try {
    const companyUser = await requireCompanyUser();
    const { id } = await params;

    const reservationId = Number(id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid reservation ID' },
        { status: 400 },
      );
    }

    const reservation = await ReservationRepository.findById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    const car = await CarRepository.findById(reservation.carId);

    if (!car || car.companyId !== companyUser.companyId) {
      return NextResponse.json(
        { ok: false, error: 'Reservation does not belong to your company' },
        { status: 403 },
      );
    }

    if (reservation.paymentMethod !== 'ON_SPOT') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only on-spot reservations can be marked as cash paid',
        },
        { status: 400 },
      );
    }

    if (reservation.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: 'Cancelled reservation cannot be updated' },
        { status: 400 },
      );
    }

    if (reservation.paymentStatus === 'PAID') {
      return NextResponse.json(
        { ok: false, error: 'Reservation is already marked as paid' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(companyUser.companyId);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    const totalPrice = Number(reservation.totalPrice || 0);
    const maintenancePercent = Number(company.maintenancePercent || 0);
    const platformFee = Number(
      ((totalPrice * maintenancePercent) / 100).toFixed(2),
    );
    const companyEarnings = Number((totalPrice - platformFee).toFixed(2));

    const updatedReservation = await ReservationRepository.update(
      reservation.id,
      {
        paymentStatus: 'PAID',
        status:
          reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'
            ? 'IN_PROGRESS'
            : reservation.status,
      },
    );

    const existingPayment = await PaymentsRepository.findByReservation(
      reservation.id,
    );

    if (existingPayment) {
      await PaymentsRepository.update(existingPayment.id, {
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        paidAt: new Date(),
        amount: totalPrice,
        totalPrice,
        platformFee,
        companyEarnings,
      });
    } else {
      await PaymentsRepository.create({
        reservationId: reservation.id,
        companyId: company.id,
        amount: totalPrice,
        totalPrice,
        platformFee,
        companyEarnings,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        stripePaymentIntentId: null,
        stripeChargeId: null,
        paidAt: new Date(),
      });
    }

    return NextResponse.json({
      ok: true,
      reservation: updatedReservation,
    });
  } catch (error: unknown) {
    console.error(
      'POST /api/company/reservations/[id]/cash-payment error:',
      error,
    );

    if (error instanceof Error) {
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { ok: false, error: 'Forbidden - Company access required' },
          { status: 403 },
        );
      }

      if (error.message === 'MISSING_COMPANY_CONTEXT') {
        return NextResponse.json(
          { ok: false, error: 'Company context missing' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
