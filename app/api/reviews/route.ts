import { NextRequest, NextResponse } from 'next/server';
import { ReviewRepository } from '@/lib/repository/ReviewRepository';
import { requireAuthUserFromRequest, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const carId = Number(req.nextUrl.searchParams.get('carId'));

    if (!carId || Number.isNaN(carId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid carId' },
        { status: 400 },
      );
    }

    const rawReviews = await ReviewRepository.findByCarId(carId);
    const averageRating =
      await ReviewRepository.findAverageRatingByCarId(carId);
    const totalReviews = await ReviewRepository.countByCarId(carId);

    const reviews = rawReviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        name: review.userName || undefined,
        email: review.userEmail || undefined,
      },
    }));

    return NextResponse.json({
      ok: true,
      reviews,
      averageRating,
      totalReviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch reviews' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUserFromRequest(req);
    const body = await req.json();

    const carId = Number(body.carId);
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!carId || Number.isNaN(carId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid carId' },
        { status: 400 },
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }

    const alreadyReviewed = await ReviewRepository.hasUserReviewedCar(
      user.id,
      carId,
    );

    if (alreadyReviewed) {
      return NextResponse.json(
        { ok: false, error: 'You already reviewed this car' },
        { status: 409 },
      );
    }

    const review = await ReviewRepository.create({
      userId: user.id,
      carId,
      rating,
      comment,
    });

    return NextResponse.json({
      ok: true,
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: error.status || 401 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to create review' },
      { status: 500 },
    );
  }
}
