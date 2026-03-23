import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';
import {
  listStripePaymentsForCompany,
  summarizePayments,
} from '@/lib/services/stripe/companyFinance';

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    if (user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden - Company access required' },
        { status: 403 },
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    const company = await CompanyRepository.findById(user.companyId);
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    try {
      const payments = await listStripePaymentsForCompany(company);
      const totals = summarizePayments(payments);

      return NextResponse.json({
        ok: true,
        source: 'stripe',
        payments,
        totalRevenue: totals.totalRevenue,
        totalPlatformFee: totals.platformFee,
        totalEarnings: totals.companyEarnings,
      });
    } catch (stripeErr) {
      console.error('Stripe payments fallback to database:', stripeErr);

      const payments = await PaymentsRepository.findByCompany(company.id);
      const totalEarnings = await PaymentsRepository.getTotalEarnings(
        company.id,
      );

      const totalRevenue = Number(
        payments
          .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
          .toFixed(2),
      );

      const totalPlatformFee = Number(
        payments
          .reduce(
            (sum: number, item: any) => sum + Number(item.platformFee || 0),
            0,
          )
          .toFixed(2),
      );

      return NextResponse.json({
        ok: true,
        source: 'database',
        payments: payments.map((item: any) => ({
          ...item,
          source: 'database',
          customerName: item.userName || '',
          customerEmail: item.userEmail || '',
          carLabel: [item.make, item.model, item.year]
            .filter(Boolean)
            .join(' '),
          paymentIntentId: item.stripePaymentIntentId || '',
          chargeId: item.stripeChargeId || '',
        })),
        totalRevenue,
        totalPlatformFee,
        totalEarnings,
      });
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/company/payments error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Server error',
        details:
          process.env.NODE_ENV === 'development'
            ? (err as Error)?.message
            : undefined,
      },
      { status: 500 },
    );
  }
}
