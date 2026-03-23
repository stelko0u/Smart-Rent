import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { assertCompanyPanelAccess } from '@/lib/services/company/companyAccess';

export async function getRequestUser(req: Request) {
  return requireAuthUserFromRequest(req);
}

export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.status },
    );
  }

  return NextResponse.json(
    { ok: false, error: 'Unauthorized' },
    { status: 401 },
  );
}

export async function requireCompanyApiUser(req: Request) {
  const user = await requireAuthUserFromRequest(req);

  if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
    throw new AuthError('Forbidden - Company access required', 403);
  }

  if (user.role === 'COMPANY') {
    await assertCompanyPanelAccess(user);
  }

  return user;
}
