import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export function handleCreatePaymentIntentError(err: unknown) {
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

  if (err instanceof Error) {
    if (err.message === 'MISSING_RESERVATION_ID') {
      return NextResponse.json(
        { ok: false, error: 'Missing reservation ID' },
        { status: 400 },
      );
    }

    if (err.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    if (err.message === 'CAR_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Car not found' },
        { status: 404 },
      );
    }

    if (err.message === 'CAR_HAS_NO_COMPANY') {
      return NextResponse.json(
        { ok: false, error: 'Car has no company attached' },
        { status: 400 },
      );
    }

    if (err.message === 'COMPANY_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    if (err.message === 'COMPANY_HAS_NO_STRIPE_ACCOUNT') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Company has no Stripe account connected',
          debug: (err as any).company ?? null,
        },
        { status: 400 },
      );
    }

    if (err.message === 'STRIPE_ACCOUNT_NOT_READY') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Company Stripe account is not ready for payments',
          onboardingRequired: true,
          stripe: (err as any).stripeDetails ?? null,
        },
        { status: 400 },
      );
    }

    if (err.message === 'INVALID_RESERVATION_DATES') {
      return NextResponse.json(
        { ok: false, error: 'Invalid reservation dates' },
        { status: 400 },
      );
    }

    if (err.message === 'INVALID_TOTAL_PRICE') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid total price',
          debug: (err as any).pricingDebug ?? null,
        },
        { status: 400 },
      );
    }
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
