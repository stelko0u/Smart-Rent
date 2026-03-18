import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { sendReservationConfirmation } from '../../../../lib/mail';
import { ReservationRepository } from '@/lib/repositories/ReservationRepository';
import { CarRepository } from '@/lib/repositories/CarRepository';
import { CompanyRepository } from '@/lib/repositories/CompanyRepository';
import { PaymentsRepository } from '@/lib/repositories/PaymentsRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
  console.log('=== CONFIRM PAYMENT ENDPOINT CALLED ===');

  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      console.error('Missing payment intent ID');
      return NextResponse.json(
        { ok: false, error: 'Missing payment intent ID' },
        { status: 400 },
      );
    }

    console.log('Fetching payment intent from Stripe:', paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment intent status:', paymentIntent.status);
    console.log('Payment intent metadata:', paymentIntent.metadata);

    if (paymentIntent.status !== 'succeeded') {
      console.error('Payment not successful, status:', paymentIntent.status);
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

    console.log('Parsed reservation ID:', reservationId);
    console.log('Parsed total price:', totalPrice);

    if (!reservationId || isNaN(reservationId)) {
      console.error('Invalid reservation ID:', reservationId);
      return NextResponse.json(
        { ok: false, error: 'Invalid reservation ID in payment metadata' },
        { status: 400 },
      );
    }

    console.log('Fetching reservation from DB:', reservationId);
    const reservation = await ReservationRepository.findById(reservationId);

    if (!reservation) {
      console.error('Reservation not found:', reservationId);
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    console.log('Reservation found:', reservation);

    console.log('Fetching car from DB:', reservation.carId);
    const car = await CarRepository.findById(reservation.carId);

    if (!car || !car.companyId) {
      console.error('Car or company not found:', { car });
      return NextResponse.json(
        { ok: false, error: 'Car or company not found' },
        { status: 404 },
      );
    }

    console.log('Car found:', { id: car.id, companyId: car.companyId });

    // Fetch company to get maintenancePercent
    console.log('Fetching company from DB:', car.companyId);
    const company = await CompanyRepository.findById(car.companyId);

    if (!company) {
      console.error('Company not found:', car.companyId);
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    console.log('Company found:', {
      id: company.id,
      name: company.name,
      maintenancePercent: company.maintenancePercent,
    });

    // Calculate payment breakdown
    const totalAmount = paymentIntent.amount / 100;
    const maintenancePercent = company.maintenancePercent || 15; // Default 15% if not set

    // Convert percentage to decimal (15% -> 0.15)
    const platformFee = Number(
      ((totalAmount * maintenancePercent) / 100).toFixed(2),
    );
    const companyEarnings = Number((totalAmount - platformFee).toFixed(2));

    console.log('Payment calculations:', {
      totalAmount,
      maintenancePercent: `${maintenancePercent}%`,
      platformFee,
      companyEarnings,
    });

    console.log('Fetching charges from Stripe');
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    const chargeId = charges.data[0]?.id || '';
    console.log('Charge ID:', chargeId);

    console.log(
      'Checking for existing payment for reservation:',
      reservationId,
    );
    const existingPayment =
      await PaymentsRepository.findByReservation(reservationId);
    console.log('Existing payment:', existingPayment);

    if (existingPayment) {
      if (
        existingPayment.paymentStatus === 'PAID' &&
        existingPayment.stripePaymentIntentId === paymentIntentId
      ) {
        console.log('Payment already processed, returning existing payment');
        return NextResponse.json({
          ok: true,
          message: 'Payment already confirmed',
          payment: existingPayment,
          reservationId,
        });
      }

      console.log('Updating existing payment to PAID');

      const updateData = {
        paymentStatus: 'PAID' as const,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: chargeId,
        paidAt: new Date(),
        amount: totalAmount,
        totalPrice: totalPrice || reservation.totalPrice,
        platformFee,
        companyEarnings,
      };

      console.log('Update data:', updateData);

      const updatedPayment = await PaymentsRepository.update(
        existingPayment.id,
        updateData,
      );

      console.log('Updated payment:', updatedPayment);

      console.log(
        'Updating reservation paymentStatus to PAID but keeping status PENDING',
      );
      await ReservationRepository.update(reservationId, {
        status: 'PENDING', // Keep PENDING until email confirmation
        paymentStatus: 'PAID',
      });

      console.log(
        'SUCCESS: Payment updated to PAID, sending confirmation email',
      );

      // Send confirmation email
      try {
        await sendReservationConfirmation(
          {
            id: reservation.id,
            firstName: reservation.firstName,
            lastName: reservation.lastName,
            email: reservation.email,
            startDate: reservation.startDate,
            endDate: reservation.endDate,
            totalPrice: reservation.totalPrice,
          },
          {
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
          },
        );
        console.log('Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the payment if email fails
      }

      return NextResponse.json({
        ok: true,
        message:
          'Payment confirmed. Please check your email to confirm the reservation.',
        payment: updatedPayment,
        reservationId,
      });
    }

    console.log('No existing payment found, creating new one');

    const createData = {
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
    };

    console.log('Create data:', createData);

    const payment = await PaymentsRepository.create(createData);

    console.log('Payment created:', payment);

    console.log(
      'Updating reservation paymentStatus to PAID but keeping status PENDING',
    );
    await ReservationRepository.update(reservationId, {
      status: 'PENDING', // Keep PENDING until email confirmation
      paymentStatus: 'PAID',
    });

    console.log('SUCCESS: Payment created, sending confirmation email');

    // Send confirmation email
    try {
      await sendReservationConfirmation(
        {
          id: reservation.id,
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
          totalPrice: reservation.totalPrice,
        },
        {
          make: car.make,
          model: car.model,
          year: car.year,
          pricePerDay: car.pricePerDay,
        },
      );
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    return NextResponse.json({
      ok: true,
      message:
        'Payment confirmed. Please check your email to confirm the reservation.',
      payment,
      reservationId,
    });
  } catch (err) {
    console.error('=== ERROR IN CONFIRM PAYMENT ===');
    console.error('Error message:', (err as Error)?.message);
    console.error('Error stack:', (err as Error)?.stack);
    console.error('Full error:', err);

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
