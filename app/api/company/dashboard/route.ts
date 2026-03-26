import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { getCompanyDashboardData } from '@/lib/services/company/companyDashboardService';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden - Company access required' },
        { status: 403 },
      );
    }

    const data = await getCompanyDashboardData(user);

    return NextResponse.json(
      {
        ok: true,
        stats: data.stats,
        recentReservations: data.recentReservations,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('GET /api/company/dashboard error:', err);

    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: err.status || 401 },
      );
    }

    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
