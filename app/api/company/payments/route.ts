import { NextResponse } from 'next/server';
import { requireCompanyUser } from '@/lib/auth/requireCompany';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';
import {
  listStripePaymentsForCompany,
  summarizePayments,
  type CompanyStripePaymentRow,
} from '@/lib/services/stripe/companyFinance';

type DatabasePaymentRow = {
  source: 'database';
  id?: number;
  reservationId: number | null;
  paymentIntentId: string;
  chargeId: string | null;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  carLabel: string;
};

function normalizeDatabasePayments(
  payments: Array<{
    id?: number;
    reservationId?: number | null;
    stripePaymentIntentId?: string | null;
    stripeChargeId?: string | null;
    amount?: number | string | null;
    platformFee?: number | string | null;
    companyEarnings?: number | string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    createdAt?: Date | string | null;
    paidAt?: Date | string | null;
    userName?: string | null;
    userEmail?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
  }>,
): DatabasePaymentRow[] {
  return payments.map((item) => ({
    source: 'database',
    id: item.id,
    reservationId: item.reservationId ?? null,
    paymentIntentId: item.stripePaymentIntentId ?? '',
    chargeId: item.stripeChargeId ?? null,
    amount: Number(item.amount ?? 0),
    platformFee: Number(item.platformFee ?? 0),
    companyEarnings: Number(item.companyEarnings ?? 0),
    paymentMethod: item.paymentMethod ?? '',
    paymentStatus: item.paymentStatus ?? 'PENDING',
    createdAt: new Date(item.createdAt ?? new Date()).toISOString(),
    paidAt: new Date(item.paidAt ?? item.createdAt ?? new Date()).toISOString(),
    customerName: item.userName ?? '',
    customerEmail: item.userEmail ?? '',
    carLabel: [item.make, item.model, item.year].filter(Boolean).join(' '),
  }));
}

function isPaidStatus(status: string) {
  const normalized = status.toUpperCase();
  return normalized === 'PAID' || normalized === 'SUCCEEDED';
}

function shouldIncludeDatabasePaymentWhenStripeExists(
  payment: DatabasePaymentRow,
  stripePaymentIntentIds: Set<string>,
) {
  const paymentMethod = payment.paymentMethod.toUpperCase();
  const paymentIntentId = payment.paymentIntentId.trim();

  if (paymentMethod === 'CASH' || paymentMethod === 'ON_SPOT') {
    return true;
  }

  if (!paymentIntentId) {
    return true;
  }

  return !stripePaymentIntentIds.has(paymentIntentId);
}

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

    const databasePayments = normalizeDatabasePayments(
      await PaymentsRepository.findByCompany(company.id),
    );

    try {
      const stripePayments = await listStripePaymentsForCompany(company);

      const stripePaymentIntentIds = new Set(
        stripePayments
          .map((payment) => payment.paymentIntentId.trim())
          .filter((paymentIntentId) => paymentIntentId.length > 0),
      );

      const supplementalDatabasePayments = databasePayments.filter((payment) =>
        shouldIncludeDatabasePaymentWhenStripeExists(
          payment,
          stripePaymentIntentIds,
        ),
      );

      const payments: Array<CompanyStripePaymentRow | DatabasePaymentRow> = [
        ...stripePayments,
        ...supplementalDatabasePayments,
      ].sort(
        (left, right) =>
          new Date(right.paidAt || right.createdAt).getTime() -
          new Date(left.paidAt || left.createdAt).getTime(),
      );

      const paidPayments = payments.filter((payment) =>
        isPaidStatus(payment.paymentStatus),
      );

      const totals = summarizePayments(
        paidPayments as CompanyStripePaymentRow[],
      );

      return NextResponse.json({
        ok: true,
        source: 'mixed',
        payments,
        totalRevenue: totals.totalRevenue,
        totalPlatformFee: totals.platformFee,
        totalEarnings: totals.companyEarnings,
      });
    } catch (stripeErr) {
      console.error('Stripe payments fallback to database:', stripeErr);

      const paidPayments = databasePayments.filter((payment) =>
        isPaidStatus(payment.paymentStatus),
      );

      const totals = summarizePayments(
        paidPayments as CompanyStripePaymentRow[],
      );

      return NextResponse.json({
        ok: true,
        source: 'database',
        payments: databasePayments,
        totalRevenue: totals.totalRevenue,
        totalPlatformFee: totals.platformFee,
        totalEarnings: totals.companyEarnings,
      });
    }
  } catch (err) {
    console.error('GET /api/company/payments error:', err);

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