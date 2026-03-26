import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserReservationDetails } from '@/lib/services/reservations/getUserReservationDetailsService';
import { handleReservationDetailsError } from '@/lib/errors/handleReservationDetailsError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    console.log('🔍 Looking for reservation:', id, 'for user:', user?.id);

    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    const reservationId = parseInt(id);

    console.log('📊 Querying database for reservation:', reservationId);

    const result = await getUserReservationDetails(reservationId, user.id);

    console.log('✅ Returning reservation data');

    return NextResponse.json(result);
  } catch (error) {
    return handleReservationDetailsError(error);
  }
}
