import { CarRepository } from '@/lib/repository/CarRepository';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservationId } = body as { reservationId?: number };

    if (!reservationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing reservation ID' },
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
    if (!car) {
      return NextResponse.json(
        { ok: false, error: 'Car not found' },
        { status: 404 },
      );
    }

    if (!car.companyId) {
      return NextResponse.json(
        { ok: false, error: 'Car has no company attached' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(car.companyId));
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    if (!company.stripeAccountId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Company has no Stripe account connected',
          debug: {
            companyId: company.id,
            companyName: company.name,
          },
        },
        { status: 400 },
      );
    }

    const connectedAccount = await stripe.accounts.retrieve(
      company.stripeAccountId,
    );

    const chargesEnabled = connectedAccount.charges_enabled === true;
    const payoutsEnabled = connectedAccount.payouts_enabled === true;

    const disabledReason =
      connectedAccount.requirements?.disabled_reason ?? null;

    const currentlyDue = connectedAccount.requirements?.currently_due ?? [];
    const pastDue = connectedAccount.requirements?.past_due ?? [];

    // По-практичен check:
    // ако charges и payouts са enabled, допускаме плащане.
    // Спираме само ако Stripe account е реално блокиран.
    if (!chargesEnabled || !payoutsEnabled) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Company Stripe account is not ready for payments',
          onboardingRequired: true,
          stripe: {
            accountId: connectedAccount.id,
            chargesEnabled,
            payoutsEnabled,
            detailsSubmitted: connectedAccount.details_submitted,
            disabledReason,
            currentlyDue,
            pastDue,
            capabilities: connectedAccount.capabilities,
          },
        },
        { status: 400 },
      );
    }

    const startDate = new Date(reservation.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reservation.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'Invalid reservation dates' },
        { status: 400 },
      );
    }

    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalPrice = Number((days * Number(car.pricePerDay || 0)).toFixed(2));

    if (totalPrice <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid total price',
          debug: {
            days,
            pricePerDay: car.pricePerDay,
            totalPrice,
          },
        },
        { status: 400 },
      );
    }

    const maintenancePercent = Number(company.maintenancePercent || 0);
    const amount = Math.round(totalPrice * 100);
    const applicationFeeAmount = Math.round(
      amount * (maintenancePercent / 100),
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      transfer_data: {
        destination: company.stripeAccountId,
      },
      application_fee_amount: applicationFeeAmount,
      on_behalf_of: company.stripeAccountId,
      metadata: {
        reservationId: String(reservationId),
        companyId: String(company.id),
        companyStripeAccountId: company.stripeAccountId,
        totalPrice: String(totalPrice),
        carId: String(car.id),
        carMake: car.make || '',
        carModel: car.model || '',
        days: String(days),
        pricePerDay: String(car.pricePerDay),
        maintenancePercent: String(maintenancePercent),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalPrice,
      platformFee: Number((applicationFeeAmount / 100).toFixed(2)),
      companyStripeAccountId: company.stripeAccountId,
      days,
      pricePerDay: car.pricePerDay,
      maintenancePercent,
      car: {
        make: car.make,
        model: car.model,
      },
    });
  } catch (err) {
    console.error('Create Payment Intent Error:', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          code: err.code ?? null,
          type: err.type ?? null,
        },
        { status: err.statusCode ?? 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create payment intent',
        details: (err as Error)?.message,
      },
      { status: 500 },
    );
  }
}
