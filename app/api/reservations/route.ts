import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { createReservation } from '@/lib/services/reservations/createReservationService';
import { listUserReservations } from '@/lib/services/reservations/listUserReservationsService';
import { handleReservationsRouteError } from '@/lib/errors/handleReservationsRouteError';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    const body = await req.json();

    const result = await createReservation({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      body,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleReservationsRouteError(err, 'create');
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    const result = await listUserReservations(user.id);

    return NextResponse.json(result);
  } catch (err) {
    return handleReservationsRouteError(err, 'list');
  }
}
