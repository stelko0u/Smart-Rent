import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { query } from '../../../../lib/db';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
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
    if (!userId || isNaN(userId)) return null;

    const user = await UserRepository.findById(userId);
    return user;
  } catch {
    return null;
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

    if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden - Company access required' },
        { status: 403 },
      );
    }

    const company = user.companyId
      ? await CompanyRepository.findById(user.companyId)
      : null;

    if (!company && user.role === 'COMPANY') {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    await processCompletedReservationsForReviewEmails({
      companyId: company!.id,
    });

    const reservations = await query(
      `SELECT 
        r.*,
        c.id as "carId",
        c.make as "carMake",
        c.model as "carModel",
        r."firstName" || ' ' || r."lastName" as "customerName",
        r.email as "customerEmail",
        r.phone as "customerPhone"
       FROM "Reservation" r
       JOIN "Car" c ON r."carId" = c.id
       WHERE c."companyId" = $1
       ORDER BY r."createdAt" DESC`,
      [company!.id],
    );

    return NextResponse.json({
      ok: true,
      reservations,
    });
  } catch (err) {
    console.error('GET /api/company/reservations error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
