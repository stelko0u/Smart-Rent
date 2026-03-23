import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { createCompanyMonthlyStripeInvoice } from '@/lib/services/stripe/companyInvoices';

function getPreviousMonthKey() {
  const now = new Date();
  const year =
    now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const month = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();
  return `${year}-${String(month).padStart(2, '0')}`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  // if (!secret || authHeader !== `Bearer ${secret}`) {
  //   return NextResponse.json(
  //     { ok: false, error: 'Unauthorized' },
  //     { status: 401 },
  //   );
  // }

  try {
    const companies = await CompanyRepository.findMany();
    const invoiceMonth = getPreviousMonthKey();

    const results: any[] = [];

    for (const company of companies) {
      try {
        const result = await createCompanyMonthlyStripeInvoice(
          company,
          invoiceMonth,
        );

        results.push({
          companyId: company.id,
          companyName: company.name || company.email,
          ok: true,
          created: result.created,
          invoiceId: result.invoice.id,
        });
      } catch (err: any) {
        results.push({
          companyId: company.id,
          companyName: company.name || company.email,
          ok: false,
          error: err?.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      invoiceMonth,
      results,
    });
  } catch (err) {
    console.error('POST /api/cron/company-monthly-invoices error:', err);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate monthly invoices',
      },
      { status: 500 },
    );
  }
}
