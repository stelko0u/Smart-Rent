import { NextResponse } from 'next/server';

export function handleReviewLinkError(error: any, method: 'GET' | 'POST') {
  console.error(`${method} review-link error:`, error);

  if (error?.name === 'TokenExpiredError') {
    return NextResponse.json(
      { ok: false, error: 'Review link expired' },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    if (error.message === 'RESERVATION_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    if (error.message === 'INVALID_REVIEW_LINK') {
      return NextResponse.json(
        { ok: false, error: 'Invalid review link' },
        { status: 403 },
      );
    }

    if (error.message === 'INVALID_RATING') {
      return NextResponse.json(
        { ok: false, error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }

    if (error.message === 'COMMENT_REQUIRED') {
      return NextResponse.json(
        { ok: false, error: 'Comment is required' },
        { status: 400 },
      );
    }

    if (error.message === 'REVIEW_AVAILABLE_AFTER_END') {
      return NextResponse.json(
        { ok: false, error: 'You can review only after the reservation ends' },
        { status: 400 },
      );
    }

    if (error.message === 'ALREADY_REVIEWED') {
      return NextResponse.json(
        { ok: false, error: 'You already reviewed this car' },
        { status: 409 },
      );
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        method === 'GET' ? 'Invalid review link' : 'Failed to submit review',
    },
    { status: 400 },
  );
}
