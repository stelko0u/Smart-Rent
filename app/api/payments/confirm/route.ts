import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CarRepository } from '@/lib/repository/CarRepository';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';
import { createCustomerPaymentStripeInvoice } from '@/lib/services/stripe/customerInvoices';
import { sendCustomerPaymentInvoiceEmail } from '@/lib/services/mail/sendCustomerPaymentInvoiceEmail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentIntentId } = body as {
      paymentIntentId?: string;
    };

    if (!paymentIntentId) {
      return NextResponse.json(
        { ok: false, error: 'Missing payment intent ID' },
        { status: 400 },
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Payment not successful',
          status: paymentIntent.status,
        },
        { status: 400 },
      );
    }

    const reservationId = Number(paymentIntent.metadata.reservationId);
    const totalPrice = Number(paymentIntent.metadata.totalPrice);

    if (!reservationId || Number.isNaN(reservationId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid reservation ID in payment metadata' },
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
    if (!car || !car.companyId) {
      return NextResponse.json(
        { ok: false, error: 'Car or company not found' },
        { status: 404 },
      );
    }

    const company = await CompanyRepository.findById(car.companyId);
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    const totalAmount = Number((paymentIntent.amount / 100).toFixed(2));
    const applicationFeeAmount = paymentIntent.application_fee_amount || 0;
    const platformFee = Number((applicationFeeAmount / 100).toFixed(2));
    const companyEarnings = Number((totalAmount - platformFee).toFixed(2));

    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    const chargeId = charges.data[0]?.id || '';

    const existingPayment =
      await PaymentsRepository.findByReservation(reservationId);

    let savedPayment;

    if (existingPayment) {
      if (
        existingPayment.paymentStatus === 'PAID' &&
        existingPayment.stripePaymentIntentId === paymentIntentId
      ) {
        savedPayment = existingPayment;
      } else {
        savedPayment = await PaymentsRepository.update(existingPayment.id, {
          paymentStatus: 'PAID' as const,
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: chargeId,
          paidAt: new Date(),
          amount: totalAmount,
          totalPrice: totalPrice || reservation.totalPrice,
          platformFee,
          companyEarnings,
          paymentMethod: 'CARD' as const,
        });
      }
    } else {
      savedPayment = await PaymentsRepository.create({
        reservationId,
        companyId: car.companyId,
        amount: totalAmount,
        totalPrice: totalPrice || reservation.totalPrice,
        platformFee,
        companyEarnings,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'CARD' as const,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: chargeId,
        paidAt: new Date(),
      });
    }

    await ReservationRepository.update(reservationId, {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
    });

    let stripeInvoice: any = null;
    let invoiceEmailSent = false;
    let invoiceWarning: string | null = null;

    try {
      stripeInvoice = await createCustomerPaymentStripeInvoice({
        company,
        reservation,
        car,
        paymentIntentId,
        chargeId,
        amountPaid: totalAmount,
        platformFee,
        companyEarnings,
      });

      await sendCustomerPaymentInvoiceEmail({
        reservation: {
          id: reservation.id,
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
        },
        car: {
          make: car.make,
          model: car.model,
          year: car.year,
          pricePerDay: car.pricePerDay,
        },
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          maintenancePercent: company.maintenancePercent,
        },
        payment: {
          amountPaid: totalAmount,
          platformFee,
          companyEarnings,
          paidAt: savedPayment?.paidAt || new Date(),
          paymentIntentId,
          chargeId,
        },
        stripeInvoice: stripeInvoice
          ? {
              id: stripeInvoice.id,
              number: stripeInvoice.number,
              hosted_invoice_url: stripeInvoice.hosted_invoice_url,
              invoice_pdf: stripeInvoice.invoice_pdf,
            }
          : null,
      });

      invoiceEmailSent = true;
    } catch (invoiceErr: any) {
      console.error('Failed to create/send customer invoice:', invoiceErr);
      invoiceWarning =
        invoiceErr?.message || 'Invoice/email could not be generated';
    }

    return NextResponse.json({
      ok: true,
      message: 'Payment confirmed and reservation is now confirmed.',
      payment: savedPayment,
      reservationId,
      invoice: stripeInvoice
        ? {
            id: stripeInvoice.id,
            number: stripeInvoice.number,
            hosted_invoice_url: stripeInvoice.hosted_invoice_url,
            invoice_pdf: stripeInvoice.invoice_pdf,
          }
        : null,
      invoiceEmailSent,
      invoiceWarning,
    });
  } catch (err) {
    console.error('=== ERROR IN CONFIRM PAYMENT ===');
    console.error(err);

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
