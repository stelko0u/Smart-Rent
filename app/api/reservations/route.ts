import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { CarRepository } from '@/lib/repository/CarRepository';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { sendReservationPaymentEmail } from '@/lib/services/mail/sendReservationPaymentEmail';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';

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

    if (!userId || Number.isNaN(userId)) return null;

    return UserRepository.findById(userId);
  } catch {
    return null;
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
      paymentMethod,
    } = body as {
      carId: number;
      startDate: string;
      endDate: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      paymentMethod?: 'CARD' | 'ON_SPOT';
    };

    if (!carId || !startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const normalizedPaymentMethod =
      paymentMethod === 'ON_SPOT' ? 'ON_SPOT' : 'CARD';

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

    const conflictingReservations = await ReservationRepository.findConflicting(
      Number(carId),
      start,
      end,
    );

    if (conflictingReservations.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Selected dates are no longer available' },
        { status: 409 },
      );
    }

    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalPrice = days * car.pricePerDay;

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
      paymentMethod: normalizedPaymentMethod,
    });

    let emailSent = false;

    if (normalizedPaymentMethod === 'CARD') {
      try {
        await sendReservationPaymentEmail(
          {
            id: reservation.id,
            firstName: reservation.firstName,
            lastName: reservation.lastName,
            email: reservation.email,
            startDate: reservation.startDate,
            endDate: reservation.endDate,
            totalPrice: reservation.totalPrice,
            paymentMethod: reservation.paymentMethod,
          },
          {
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
          },
        );

        emailSent = true;
      } catch (mailError) {
        console.error(
          `Failed to send reservation payment email for reservation #${reservation.id}:`,
          mailError,
        );
      }
    }

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
      flow: {
        paymentMethod: normalizedPaymentMethod,
        emailSent,
        nextStep:
          normalizedPaymentMethod === 'CARD'
            ? emailSent
              ? 'CHECK_EMAIL'
              : 'PAYMENT_PAGE'
            : 'RESERVATION_CREATED',
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

    await processCompletedReservationsForReviewEmails({ userId: user.id });

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
