import { NextResponse } from 'next/server';

export function handleStripeWebhookError(error: unknown) {
  console.error('Stripe webhook error:', error);

  if (error instanceof Error) {
    if (error.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }
  }

  return NextResponse.json(
    { error: 'Webhook handling failed' },
    { status: 500 },
  );
}
