import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export type ReviewEmailTokenPayload = {
  type: 'review-request';
  reservationId: number;
  carId: number;
  userId: number;
  email: string;
};

export function createReviewEmailToken(payload: {
  reservationId: number;
  carId: number;
  userId: number;
  email: string;
}) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      type: 'review-request',
      reservationId: payload.reservationId,
      carId: payload.carId,
      userId: payload.userId,
      email: payload.email,
    } satisfies ReviewEmailTokenPayload,
    JWT_SECRET,
    {
      expiresIn: '30d',
      subject: String(payload.reservationId),
    },
  );
}

export function verifyReviewEmailToken(token: string): ReviewEmailTokenPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = jwt.verify(token, JWT_SECRET) as ReviewEmailTokenPayload;

  if (payload.type !== 'review-request') {
    throw new Error('Invalid review token type');
  }

  return payload;
}
