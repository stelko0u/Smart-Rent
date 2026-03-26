import { NextResponse } from 'next/server';
import { authErrorResponse } from '@/lib/api';

export function handleCompanyOfficesError(
  err: any,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  if (err?.message === 'company_activation_required' || err?.status === 403) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Forbidden',
        access: err?.details ?? null,
      },
      { status: err?.status || 403 },
    );
  }

  if (err instanceof Error) {
    if (err.message === 'COMPANY_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    if (err.message === 'NAME_AND_ADDRESS_REQUIRED') {
      return NextResponse.json(
        { ok: false, error: 'name_and_address_required' },
        { status: 400 },
      );
    }

    if (err.message === 'INVALID_OFFICE_ID') {
      return NextResponse.json(
        { ok: false, error: 'invalid_office_id' },
        { status: 400 },
      );
    }

    if (err.message === 'OFFICE_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'office_not_found' },
        { status: 404 },
      );
    }
  }

  const authResponse = authErrorResponse(err);
  if (authResponse.status !== 401) {
    return authResponse;
  }

  console.error(`company/offices ${method} error:`, err);

  return NextResponse.json(
    { ok: false, error: 'Internal server error' },
    { status: 500 },
  );
}
