import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { listCompanyCustomerInvoices } from '@/lib/services/stripe/customerInvoices';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { ok: false, error: 'No company attached to this user' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(user.companyId));

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    const invoices = await listCompanyCustomerInvoices(company.id);

    return NextResponse.json({
      ok: true,
      invoices,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/company/invoices error:', err);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load invoices',
        details:
          process.env.NODE_ENV === 'development'
            ? (err as Error)?.message
            : undefined,
      },
      { status: 500 },
    );
  }
}
