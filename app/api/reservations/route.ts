import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth';
import { query } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    console.log('📝 Creating reservation for user:', user?.id);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      carId,
      startDate,
      endDate,
      firstName,
      lastName,
      email,
      phone,
      paymentMethod,
    } = body;

    // Validation
    if (
      !carId ||
      !startDate ||
      !endDate ||
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if car exists and is available
    const cars = await query('SELECT id FROM "Car" WHERE id = $1', [carId]);
    if (cars.length === 0) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Check for overlapping reservations
    const overlapping = await query(
      `SELECT id FROM "Reservation" 
       WHERE "carId" = $1 
       AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
       AND (
         ($2 >= "startDate" AND $2 < "endDate") OR
         ($3 > "startDate" AND $3 <= "endDate") OR
         ($2 <= "startDate" AND $3 >= "endDate")
       )`,
      [carId, startDate, endDate],
    );

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: 'Car is not available for selected dates' },
        { status: 400 },
      );
    }

    // Determine status based on payment method
    const status = paymentMethod === 'ON_SPOT' ? 'CONFIRMED' : 'PENDING';

    // Create reservation
    const result = await query(
      `INSERT INTO "Reservation" 
       ("userId", "carId", "startDate", "endDate", "firstName", "lastName", "email", "phone", "status", "paymentMethod", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        user.id,
        carId,
        startDate,
        endDate,
        firstName,
        lastName,
        email,
        phone,
        status,
        paymentMethod || 'CARD',
      ],
    );

    console.log('✅ Reservation created:', {
      id: result[0].id,
      userId: result[0].userId,
      carId: result[0].carId,
      status: result[0].status,
    });

    return NextResponse.json({ reservation: result[0] }, { status: 201 });
  } catch (error) {
    console.error('❌ POST reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 },
    );
  }
}
// 122
// 58.77
