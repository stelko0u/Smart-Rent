import { NextResponse } from 'next/server';
import { stripe } from '@/lib/services/stripe/stripe';
import { requireCompanyUser } from '@/lib/auth/requireCompany';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';

export async function POST() {
  try {
    const user = await requireCompanyUser();

    const company = await CompanyRepository.findById(user.companyId);

    if (!company || !company.stripeAccountId) {
      return NextResponse.json(
        { ok: false, error: 'Stripe account not connected' },
        { status: 400 },
      );
    }

    const loginLink = await stripe.accounts.createLoginLink(
      company.stripeAccountId,
    );

    return NextResponse.json({
      ok: true,
      url: loginLink.url,
    });
  } catch (error) {
    console.error('Stripe login link error:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to create login link' },
      { status: 500 },
    );
  }
}
