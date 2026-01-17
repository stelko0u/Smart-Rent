import { NextResponse } from 'next/server';
import { reservationService } from '../../lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carId, startDate, endDate, firstName, lastName, email, phone, notes } = body;

    if (!carId || !startDate || !endDate || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if car is already reserved for this period
    const isAvailable = await reservationService.isCarAvailable(
      carId, 
      new Date(startDate), 
      new Date(endDate)
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Car is already reserved for this period' },
        { status: 409 }
      );
    }

    // Create reservation with guest information
    const reservation = await reservationService.create({
      carId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PENDING',
      userId: null, // Guest reservation
      firstName,
      lastName,
      email,
      phone,
      notes
    });

    // Generate reference number
    const reference = `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        reference,
        carId,
        startDate,
        endDate,
        status: 'PENDING'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const carId = url.searchParams.get('carId');
    
    if (!carId) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 }
      );
    }

    const reservations = await reservationService.getByCar(Number(carId));

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('GET /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}