import { NextResponse } from 'next/server';

export function handleMarkPaymentFailedError(err: unknown) {
  console.error('POST /api/payments/failed error:', err);

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
  }

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
