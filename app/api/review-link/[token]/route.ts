import { NextRequest, NextResponse } from 'next/server';

import { queryOne } from '@/lib/db';
import { ReviewRepository } from '@/lib/repository/ReviewRepository';
import { verifyReviewEmailToken } from '@/lib/services/reviews/reviewEmailToken';

type Params = {
  params: Promise<{
    token: string;
  }>;
};

function normalizeImageUrl(value?: string | null) {
  if (!value) return null;

  const normalized = String(value).replace(/\\/g, '/').trim();

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:')
  ) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  if (normalized.startsWith('public/')) {
    return `/${normalized.slice('public/'.length)}`;
  }

  const publicIndex = normalized.indexOf('/public/');
  if (publicIndex !== -1) {
    return normalized.slice(publicIndex + '/public'.length);
  }

  return `/${normalized}`;
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const payload = verifyReviewEmailToken(token);

    const reservation = await queryOne<any>(
      `
      SELECT
        r.id,
        r."userId",
        r."carId",
        r."firstName",
        r."lastName",
        r.email,
        r.status,
        r."startDate",
        r."endDate",
        c.make,
        c.model,
        c.year,
        c."images" as "carImages",
        c.images as "carImages"
      FROM "Reservation" r
      JOIN "Car" c ON c.id = r."carId"
      WHERE r.id = $1
      `,
      [payload.reservationId],
    );

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    if (
      reservation.userId !== payload.userId ||
      reservation.carId !== payload.carId ||
      reservation.email !== payload.email
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review link' },
        { status: 403 },
      );
    }

    const alreadyReviewed = await ReviewRepository.hasUserReviewedCar(
      reservation.userId,
      reservation.carId,
    );

    let rawImageUrl: string | null = reservation.carImageUrl || null;

    if (
      !rawImageUrl &&
      Array.isArray(reservation.carImages) &&
      reservation.carImages.length > 0
    ) {
      rawImageUrl = reservation.carImages[0];
    }

    const imageUrl = normalizeImageUrl(rawImageUrl);

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservation.id,
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        email: reservation.email,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        status: reservation.status,
      },
      car: {
        id: reservation.carId,
        make: reservation.make,
        model: reservation.model,
        year: reservation.year,
        imageUrl,
      },
      alreadyReviewed,
      canReview:
        reservation.status === 'COMPLETED' || reservation.status === 'RETURNED',
    });
  } catch (error: any) {
    console.error('GET review-link error:', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.name === 'TokenExpiredError'
            ? 'Review link expired'
            : 'Invalid review link',
      },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const payload = verifyReviewEmailToken(token);

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }

    if (!comment) {
      return NextResponse.json(
        { ok: false, error: 'Comment is required' },
        { status: 400 },
      );
    }

    const reservation = await queryOne<any>(
      `
      SELECT
        r.id,
        r."userId",
        r."carId",
        r.email,
        r.status,
        r."endDate"
      FROM "Reservation" r
      WHERE r.id = $1
      `,
      [payload.reservationId],
    );

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    if (
      reservation.userId !== payload.userId ||
      reservation.carId !== payload.carId ||
      reservation.email !== payload.email
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review link' },
        { status: 403 },
      );
    }

    const reservationEnd = new Date(reservation.endDate);
    const now = new Date();

    if (reservationEnd > now) {
      return NextResponse.json(
        { ok: false, error: 'You can review only after the reservation ends' },
        { status: 400 },
      );
    }

    const alreadyReviewed = await ReviewRepository.hasUserReviewedCar(
      reservation.userId,
      reservation.carId,
    );

    if (alreadyReviewed) {
      return NextResponse.json(
        { ok: false, error: 'You already reviewed this car' },
        { status: 409 },
      );
    }

    const review = await ReviewRepository.create({
      carId: reservation.carId,
      userId: reservation.userId,
      rating,
      comment,
    });

    return NextResponse.json({
      ok: true,
      review,
    });
  } catch (error: any) {
    console.error('POST review-link error:', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.name === 'TokenExpiredError'
            ? 'Review link expired'
            : 'Failed to submit review',
      },
      { status: 400 },
    );
  }
}
