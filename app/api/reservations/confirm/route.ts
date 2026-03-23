import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { ReservationRepository } from '@/lib/repository/ReservationRepository';

const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET || !APP_URL) {
      return NextResponse.json(
        { ok: false, error: 'Server misconfigured' },
        { status: 500 },
      );
    }

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/?error=missing_token`);
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

      if (payload.type !== 'confirm-reservation-before-payment') {
        return NextResponse.redirect(`${APP_URL}/?error=invalid_token_type`);
      }

      const reservationId = Number(payload.reservationId);

      if (!reservationId || Number.isNaN(reservationId)) {
        return NextResponse.redirect(`${APP_URL}/?error=invalid_reservation`);
      }

      const reservation = await ReservationRepository.findById(reservationId);

      if (!reservation) {
        return NextResponse.redirect(`${APP_URL}/?error=reservation_not_found`);
      }

      if (reservation.status === 'CANCELLED') {
        return NextResponse.redirect(`${APP_URL}/?error=reservation_cancelled`);
      }

      if (reservation.paymentMethod === 'ON_SPOT') {
        if (reservation.status !== 'CONFIRMED') {
          await ReservationRepository.update(reservationId, {
            status: 'CONFIRMED',
          });
        }

        return NextResponse.redirect(
          `${APP_URL}/reservation/success?id=${reservationId}&step=confirmed`,
        );
      }

      if (reservation.paymentStatus === 'PAID') {
        if (reservation.status !== 'CONFIRMED') {
          await ReservationRepository.update(reservationId, {
            status: 'CONFIRMED',
          });
        }

        return NextResponse.redirect(
          `${APP_URL}/reservation/success?id=${reservationId}&step=confirmed`,
        );
      }

      return NextResponse.redirect(`${APP_URL}/payment/${reservationId}`);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.redirect(`${APP_URL}/?error=token_expired`);
      }

      if (err instanceof jwt.JsonWebTokenError) {
        return NextResponse.redirect(`${APP_URL}/?error=invalid_token`);
      }

      throw err;
    }
  } catch (err) {
    console.error('Error confirming reservation before payment:', err);
    return NextResponse.redirect(`${APP_URL}/?error=server_error`);
  }
}
