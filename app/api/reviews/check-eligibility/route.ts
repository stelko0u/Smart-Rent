import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUserFromRequest, AuthError } from '../../../../lib/auth';
import { ReviewRepository } from '@/lib/repositories/ReviewRepository';

// GET /api/reviews/check-eligibility?carId={id}
// Проверява дали потребителят може да добави ревю за конкретен автомобил
// Работи и с Bearer token, и с auth cookie
// Response: { canAddReview: boolean, reservationId: number | null }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('carId');

    if (!carId) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 },
      );
    }

    let user;

    try {
      user = await requireAuthUserFromRequest(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { canAddReview: false, reservationId: null },
          { status: 200 },
        );
      }
      throw error;
    }

    if (user.banned) {
      return NextResponse.json(
        { canAddReview: false, reservationId: null },
        { status: 200 },
      );
    }

    const parsedCarId = parseInt(carId, 10);

    if (Number.isNaN(parsedCarId)) {
      return NextResponse.json({ error: 'Invalid Car ID' }, { status: 400 });
    }

    // Намиране на резервации за този автомобил
    const reservations = await ReviewRepository.findUserReservationsForCar(
      user.id,
      parsedCarId,
    );

    // Намиране на първата резервация, която е започнала и няма ревю
    const now = new Date();

    for (const reservation of reservations) {
      if (new Date(reservation.startDate) <= now) {
        const hasReviewed = await ReviewRepository.hasUserReviewedReservation(
          user.id,
          parsedCarId,
          reservation.id,
        );

        if (!hasReviewed) {
          return NextResponse.json(
            {
              canAddReview: true,
              reservationId: reservation.id,
            },
            { status: 200 },
          );
        }
      }
    }

    return NextResponse.json(
      {
        canAddReview: false,
        reservationId: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
