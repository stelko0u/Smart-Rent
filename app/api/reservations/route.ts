import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { query } from '../../../lib/db';
import { UserRepository } from '@/lib/repositories/userRepository';
import { CarRepository } from '@/lib/repositories/CarRepository';
import { ReservationRepository } from '@/lib/repositories/ReservationRepository';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7).trim();
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(
    new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function getUserFromToken(req: Request) {
  if (!JWT_SECRET) return null;
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = Number(payload.userId ?? payload.sub);
    if (!userId || isNaN(userId)) return null;

    const user = await UserRepository.findById(userId);
    return user;
  } catch (err) {
    return null;
  }
}

async function updateExpiredReservations(userId?: number) {
  const now = new Date();

  try {
    const whereClause = userId
      ? `WHERE "userId" = $2 AND status IN ('CONFIRMED', 'IN_PROGRESS') AND "endDate" < $1 AND "paymentStatus" = 'PAID'`
      : `WHERE status IN ('CONFIRMED', 'IN_PROGRESS') AND "endDate" < $1 AND "paymentStatus" = 'PAID'`;

    const params = userId ? [now, userId] : [now];

    const result = await query(
      `UPDATE "Reservation" 
       SET status = 'COMPLETED', "updatedAt" = NOW()
       ${whereClause}
       RETURNING id`,
      params,
    );

    if (result.length > 0) {
      console.log(
        `Auto-updated ${result.length} reservations to COMPLETED for user ${userId || 'all'}`,
      );
    }
  } catch (err) {
    console.error('Error updating expired reservations:', err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
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
      licenseNumber,
    } = body;

    if (!carId || !startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const car = await CarRepository.findById(Number(carId));

    if (!car) {
      return NextResponse.json(
        { ok: false, error: 'Car not found' },
        { status: 404 },
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return NextResponse.json(
        { ok: false, error: 'End date must be on or after start date' },
        { status: 400 },
      );
    }

    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const totalPrice = days * car.pricePerDay;

    console.log('Reservation Calculation:', {
      carId,
      carMake: car.make,
      carModel: car.model,
      pricePerDay: car.pricePerDay,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days,
      totalPrice,
      calculation: `${days} days × $${car.pricePerDay} = $${totalPrice}`,
    });

    const reservation = await ReservationRepository.create({
      userId: user.id,
      carId: Number(carId),
      startDate: start,
      endDate: end,
      totalPrice,
      firstName: firstName || user.name || '',
      lastName: lastName || user.name || '',
      email: email || user.email,
      phone: phone || '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
    });

    console.log('Reservation Created:', {
      id: reservation.id,
      totalPrice: reservation.totalPrice,
      days,
    });

    return NextResponse.json({
      ok: true,
      reservation: {
        ...reservation,
        car: {
          make: car.make,
          model: car.model,
          pricePerDay: car.pricePerDay,
        },
        days,
      },
    });
  } catch (err) {
    console.error('POST /api/reservations error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create reservation',
        details: (err as Error)?.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Update expired reservations before fetching
    await updateExpiredReservations(user.id);

    const reservations = await ReservationRepository.findByUser(user.id);

    return NextResponse.json({
      ok: true,
      reservations,
    });
  } catch (err) {
    console.error('GET /api/reservations error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }
}
