import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { OfficeRepository } from '@/lib/repository/OfficeRepository';
import { requireCompanyApiUser, authErrorResponse } from '@/lib/api';

export async function GET(req: Request) {
  try {
    const user = await requireCompanyApiUser(req);

    const companyId = user.companyId ?? null;
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    const company = await CompanyRepository.findById(Number(companyId));
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    const offices = await OfficeRepository.findByCompany(Number(companyId));

    return NextResponse.json({
      ok: true,
      offices,
    });
  } catch (err: any) {
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

    const authResponse = authErrorResponse(err);
    if (authResponse.status !== 401) {
      return authResponse;
    }

    console.error('company/offices GET error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
