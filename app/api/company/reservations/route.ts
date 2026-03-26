import { NextResponse } from 'next/server';
import { requireCompanyUser } from '@/lib/auth/requireCompany';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

export async function GET() {
  try {
    const user = await requireCompanyUser();

    const company = await CompanyRepository.findById(user.companyId);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    await processCompletedReservationsForReviewEmails({
      companyId: company.id,
    });

    const reservations = await ReservationRepository.getReservationsByCompanyId(company.id);

    return NextResponse.json({
      ok: true,
      reservations,
    });
  } catch (err) {
    console.error('GET /api/company/reservations error:', err);

    if (err instanceof Error) {
      if (err.message === 'FORBIDDEN') {
        return NextResponse.json(
          { ok: false, error: 'Forbidden - Company access required' },
          { status: 403 },
        );
      }

      if (err.message === 'MISSING_COMPANY_CONTEXT') {
        return NextResponse.json(
          { ok: false, error: 'Company not found' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
