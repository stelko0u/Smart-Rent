import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ReservationRepository } from '@/lib/repositories/ReservationRepository';

const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET) {
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
      // Verify token
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

      if (payload.type !== 'confirm-reservation') {
        return NextResponse.redirect(`${APP_URL}/?error=invalid_token_type`);
      }

      const reservationId = Number(payload.reservationId);

      if (!reservationId || isNaN(reservationId)) {
        return NextResponse.redirect(`${APP_URL}/?error=invalid_reservation`);
      }

      // Get reservation
      const reservation = await ReservationRepository.findById(reservationId);

      if (!reservation) {
        return NextResponse.redirect(`${APP_URL}/?error=reservation_not_found`);
      }

      // Check if already confirmed
      if (reservation.status === 'CONFIRMED') {
        return NextResponse.redirect(
          `${APP_URL}/profile?message=already_confirmed`,
        );
      }

      // Update reservation status to CONFIRMED
      await ReservationRepository.update(reservationId, {
        status: 'CONFIRMED',
      });

      console.log(`Reservation #${reservationId} confirmed via email link`);

      // Redirect to success page
      return NextResponse.redirect(
        `${APP_URL}/reservation/success?id=${reservationId}&confirmed=true`,
      );
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
    console.error('Error confirming reservation:', err);
    return NextResponse.redirect(`${APP_URL}/?error=server_error`);
  }
}
