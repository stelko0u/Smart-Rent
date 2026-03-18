import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const role =
      typeof user?.role === 'string' ? user.role.toLowerCase().trim() : null;

    if (role !== 'company') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      company: {
        id: user.companyId ?? null,
        name: user.name ?? null,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error('company/me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
