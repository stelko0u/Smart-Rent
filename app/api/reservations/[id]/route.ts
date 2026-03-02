import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth';
import { query } from '@/app/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    const { id } = await params; // Await params here

    console.log('🔍 Looking for reservation:', id, 'for user:', user?.id);

    if (!user) {
      console.log('❌ No user authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      console.log('❌ Invalid reservation ID:', id);
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 },
      );
    }

    console.log('📊 Querying database for reservation:', reservationId);

    const reservations = await query(
      `SELECT 
        r.*,
        c.make as "carMake",
        c.model as "carModel",
        c.images as "carImages",
        c."pricePerDay"
      FROM "Reservation" r
      JOIN "Car" c ON r."carId" = c.id
      WHERE r.id = $1 AND r."userId" = $2`,
      [reservationId, user.id],
    );

    console.log('📦 Query result:', reservations.length, 'reservations found');

    if (reservations.length === 0) {
      // Try without user filter to see if reservation exists at all
      const anyReservation = await query(
        'SELECT id, "userId" FROM "Reservation" WHERE id = $1',
        [reservationId],
      );

      if (anyReservation.length > 0) {
        console.log(
          '⚠️ Reservation exists but belongs to user:',
          anyReservation[0].userId,
          'not',
          user.id,
        );
      } else {
        console.log('⚠️ Reservation does not exist in database');
      }

      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }

    const reservation = reservations[0];

    // Calculate days (+1 to include both start and end date)
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate total
    const pricePerDay = parseFloat(reservation.pricePerDay);
    const totalAmount = days * pricePerDay;

    console.log('✅ Returning reservation data');

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        carMake: reservation.carMake,
        carModel: reservation.carModel,
        carImage: reservation.carImages?.[0] || null,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        days,
        pricePerDay,
        totalAmount,
        status: reservation.status,
        paymentMethod: reservation.paymentMethod,
      },
    });
  } catch (error) {
    console.error('❌ GET reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to load reservation' },
      { status: 500 },
    );
  }
}
