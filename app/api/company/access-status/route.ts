import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { getCompanyAccessStatus } from '@/lib/services/company/companyAccess';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    if (user.role !== 'COMPANY') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    const status = await getCompanyAccessStatus(user);

    return NextResponse.json({
      ok: true,
      access: status,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/company/access-status error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
