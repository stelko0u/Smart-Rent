import { NextResponse } from 'next/server';

export function handleReservationsRouteError(
  err: unknown,
  mode: 'create' | 'list',
) {
  const label =
    mode === 'create'
      ? 'POST /api/reservations error:'
      : 'GET /api/reservations error:';

  console.error(label, err);

  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (mode === 'create') {
      if (err.message === 'MISSING_REQUIRED_FIELDS') {
        return NextResponse.json(
          { ok: false, error: 'Missing required fields' },
          { status: 400 },
        );
      }

      if (err.message === 'CAR_NOT_FOUND') {
        return NextResponse.json(
          { ok: false, error: 'Car not found' },
          { status: 404 },
        );
      }

      if (err.message === 'INVALID_RESERVATION_DATES') {
        return NextResponse.json(
          { ok: false, error: 'Invalid reservation dates' },
          { status: 400 },
        );
      }

      if (err.message === 'INVALID_RESERVATION_RANGE') {
        return NextResponse.json(
          { ok: false, error: 'End date must be on or after start date' },
          { status: 400 },
        );
      }

      if (err.message === 'DATES_NOT_AVAILABLE') {
        return NextResponse.json(
          { ok: false, error: 'Selected dates are no longer available' },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to create reservation',
          details:
            process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        mode === 'create'
          ? 'Failed to create reservation'
          : 'Failed to fetch reservations',
    },
    { status: 500 },
  );
}
