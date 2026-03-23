import Stripe from 'stripe';
import { Company } from '@/types/database';
import { query } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export type CompanyStripePaymentRow = {
  source: 'stripe' | 'database';
  paymentIntentId: string;
  chargeId: string | null;
  reservationId: number | null;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  carLabel: string;
};

function inRange(
  unixSeconds: number,
  startDate?: Date | null,
  endDate?: Date | null,
) {
  const ms = unixSeconds * 1000;
  if (startDate && ms < startDate.getTime()) return false;
  if (endDate && ms > endDate.getTime()) return false;
  return true;
}

export async function listStripePaymentsForCompany(
  company: Company,
  startDate?: Date | null,
  endDate?: Date | null,
): Promise<CompanyStripePaymentRow[]> {
  const reservationMapRows = await query<{
    reservationId: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  }>(
    `
      SELECT
        r.id as "reservationId",
        r."firstName",
        r."lastName",
        r.email,
        c.make,
        c.model,
        c.year
      FROM "Reservation" r
      JOIN "Car" c ON c.id = r."carId"
      WHERE c."companyId" = $1
    `,
    [company.id],
  );

  const reservationMap = new Map<number, any>();
  for (const row of reservationMapRows) {
    reservationMap.set(Number(row.reservationId), row);
  }

  const rows: CompanyStripePaymentRow[] = [];
  let startingAfter: string | undefined;
  let pageCount = 0;

  while (pageCount < 10) {
    const result = await stripe.paymentIntents.list({
      limit: 100,
      starting_after: startingAfter,
    });

    for (const item of result.data) {
      if (item.status !== 'succeeded') continue;
      if (item.metadata?.companyId !== String(company.id)) continue;
      if (!inRange(item.created, startDate, endDate)) continue;

      const reservationId = Number(item.metadata?.reservationId || 0) || null;
      const reservation = reservationId
        ? reservationMap.get(reservationId)
        : null;

      const amount = Number((item.amount / 100).toFixed(2));
      const platformFee = Number(
        ((item.application_fee_amount || 0) / 100).toFixed(2),
      );
      const companyEarnings = Number((amount - platformFee).toFixed(2));

      rows.push({
        source: 'stripe',
        paymentIntentId: item.id,
        chargeId:
          typeof item.latest_charge === 'string'
            ? item.latest_charge
            : (item.latest_charge as any)?.id || null,
        reservationId,
        amount,
        platformFee,
        companyEarnings,
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        createdAt: new Date(item.created * 1000).toISOString(),
        paidAt: new Date(item.created * 1000).toISOString(),
        customerName: reservation
          ? `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim()
          : '',
        customerEmail: reservation?.email || '',
        carLabel: reservation
          ? [reservation.make, reservation.model, reservation.year]
              .filter(Boolean)
              .join(' ')
          : [item.metadata?.carMake, item.metadata?.carModel]
              .filter(Boolean)
              .join(' '),
      });
    }

    if (!result.has_more || result.data.length === 0) {
      break;
    }

    startingAfter = result.data[result.data.length - 1].id;
    pageCount += 1;
  }

  return rows.sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );
}

export async function getStripeBalanceSummary(company: Company) {
  if (!company.stripeAccountId) {
    return {
      available: 0,
      pending: 0,
      currency: 'eur',
    };
  }

  const balance = await stripe.balance.retrieve(
    {},
    {
      stripeAccount: company.stripeAccountId,
    },
  );

  const available = balance.available.reduce(
    (sum, item) => sum + (item.currency === 'eur' ? item.amount : 0),
    0,
  );

  const pending = balance.pending.reduce(
    (sum, item) => sum + (item.currency === 'eur' ? item.amount : 0),
    0,
  );

  return {
    available: Number((available / 100).toFixed(2)),
    pending: Number((pending / 100).toFixed(2)),
    currency: 'eur',
  };
}

export function summarizePayments(rows: CompanyStripePaymentRow[]) {
  return {
    totalRevenue: Number(
      rows.reduce((sum, row) => sum + Number(row.amount || 0), 0).toFixed(2),
    ),
    platformFee: Number(
      rows
        .reduce((sum, row) => sum + Number(row.platformFee || 0), 0)
        .toFixed(2),
    ),
    companyEarnings: Number(
      rows
        .reduce((sum, row) => sum + Number(row.companyEarnings || 0), 0)
        .toFixed(2),
    ),
  };
}
