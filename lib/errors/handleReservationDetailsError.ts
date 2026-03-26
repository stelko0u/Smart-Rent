import { NextResponse } from 'next/server';

export function handleReservationDetailsError(error: unknown) {
  console.error('❌ GET reservation error:', error);

  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message === 'INVALID_RESERVATION_ID') {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 },
      );
    }

    if (error.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }
  }

  return NextResponse.json(
    { error: 'Failed to load reservation' },
    { status: 500 },
  );
}
