import { queryOne } from '@/lib/db';
import { ReviewRepository } from '@/lib/repository/ReviewRepository';
import { verifyReviewEmailToken } from '@/lib/services/reviews/reviewEmailToken';

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

async function getReservationForReviewLink(reservationId: number) {
  return queryOne<any>(
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
      c."images" as "carImages"
    FROM "Reservation" r
    JOIN "Car" c ON c.id = r."carId"
    WHERE r.id = $1
    `,
    [reservationId],
  );
}

async function getReservationForReviewSubmit(reservationId: number) {
  return queryOne<any>(
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
    [reservationId],
  );
}

function validateReviewLinkReservation(reservation: any, payload: any) {
  if (!reservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  if (
    reservation.userId !== payload.userId ||
    reservation.carId !== payload.carId ||
    reservation.email !== payload.email
  ) {
    throw new Error('INVALID_REVIEW_LINK');
  }
}

export async function getReviewLinkData(token: string) {
  const payload = verifyReviewEmailToken(token);

  const reservation = await getReservationForReviewLink(payload.reservationId);

  validateReviewLinkReservation(reservation, payload);

  const alreadyReviewed = await ReviewRepository.hasUserReviewedCar(
    reservation.userId,
    reservation.carId,
  );

  let rawImageUrl: string | null = null;

  if (
    Array.isArray(reservation.carImages) &&
    reservation.carImages.length > 0
  ) {
    rawImageUrl = reservation.carImages[0];
  }

  const imageUrl = normalizeImageUrl(rawImageUrl);

  return {
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
  };
}

export async function submitReviewFromLink(
  token: string,
  body: { rating?: number; comment?: string },
) {
  const payload = verifyReviewEmailToken(token);

  const rating = Number(body?.rating);
  const comment = String(body?.comment || '').trim();

  if (!rating || rating < 1 || rating > 5) {
    throw new Error('INVALID_RATING');
  }

  if (!comment) {
    throw new Error('COMMENT_REQUIRED');
  }

  const reservation = await getReservationForReviewSubmit(
    payload.reservationId,
  );

  validateReviewLinkReservation(reservation, payload);

  const reservationEnd = new Date(reservation.endDate);
  const now = new Date();

  if (reservationEnd > now) {
    throw new Error('REVIEW_AVAILABLE_AFTER_END');
  }

  const alreadyReviewed = await ReviewRepository.hasUserReviewedCar(
    reservation.userId,
    reservation.carId,
  );

  if (alreadyReviewed) {
    throw new Error('ALREADY_REVIEWED');
  }

  const review = await ReviewRepository.create({
    carId: reservation.carId,
    userId: reservation.userId,
    rating,
    comment,
  });

  return {
    ok: true,
    review,
  };
}
