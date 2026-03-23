import Stripe from 'stripe';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';
import { Company } from '@/types/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function parseInvoiceMonth(invoiceMonth?: string) {
  const now = new Date();

  const defaultYear =
    now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();

  const defaultMonth = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();

  const value =
    invoiceMonth || `${defaultYear}-${String(defaultMonth).padStart(2, '0')}`;

  const match = value.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    throw new Error('Invalid invoice month. Use YYYY-MM');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new Error('Invalid invoice month. Use YYYY-MM');
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return {
    invoiceMonth: value,
    start,
    endExclusive,
  };
}

function monthLabel(invoiceMonth: string) {
  const [year, month] = invoiceMonth.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('bg-BG', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

async function ensureBillingCustomer(company: Company) {
  if (company.stripeBillingCustomerId) {
    return company.stripeBillingCustomerId;
  }

  const customer = await stripe.customers.create({
    email: company.email,
    name: company.name || `Company #${company.id}`,
    metadata: {
      companyId: String(company.id),
      type: 'company_billing',
    },
  });

  await CompanyRepository.update(company.id, {
    stripeBillingCustomerId: customer.id,
  });

  return customer.id;
}

export async function listCompanyStripeInvoices(company: Company) {
  if (!company.stripeBillingCustomerId) {
    return [];
  }

  const invoices = await stripe.invoices.list({
    customer: company.stripeBillingCustomerId,
    limit: 100,
  });

  const filtered = invoices.data.filter(
    (invoice) =>
      invoice.metadata?.kind === 'company_monthly_platform_fee' &&
      invoice.metadata?.companyId === String(company.id) &&
      invoice.status !== 'void',
  );

  const latestByMonth = new Map<string, any>();

  for (const invoice of filtered) {
    const row = {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      currency: invoice.currency,
      total: Number(invoice.metadata?.grossAmount ?? 0),
      fee: Number(invoice.metadata?.platformFee ?? 0),
      totalAfterFee: Number(invoice.metadata?.netAmount ?? 0),
      amount_due: invoice.amount_due / 100,
      amount_paid: invoice.amount_paid / 100,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      created: invoice.created,
      due_date: invoice.due_date,
      invoiceMonth: invoice.metadata?.invoiceMonth || null,
      paymentsCount: Number(invoice.metadata?.paymentsCount ?? 0),
    };

    const key = row.invoiceMonth || row.id;
    const existing = latestByMonth.get(key);

    if (!existing || row.created > existing.created) {
      latestByMonth.set(key, row);
    }
  }

  return Array.from(latestByMonth.values()).sort(
    (a, b) => b.created - a.created,
  );
}

async function findExistingMonthlyInvoice(
  customerId: string,
  companyId: number,
  invoiceMonth: string,
) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 100,
  });

  return (
    invoices.data.find(
      (invoice) =>
        invoice.metadata?.kind === 'company_monthly_platform_fee' &&
        invoice.metadata?.companyId === String(companyId) &&
        invoice.metadata?.invoiceMonth === invoiceMonth &&
        invoice.status !== 'void',
    ) || null
  );
}

export async function createCompanyMonthlyStripeInvoice(
  company: Company,
  invoiceMonth?: string,
) {
  const {
    invoiceMonth: monthKey,
    start,
    endExclusive,
  } = parseInvoiceMonth(invoiceMonth);

  const summary = await PaymentsRepository.getMonthlyPlatformFeeSummary(
    company.id,
    start,
    endExclusive,
  );

  if (summary.paymentsCount === 0) {
    throw new Error('Няма платени резервации за този месец');
  }

  if (summary.platformFee <= 0) {
    throw new Error(
      'Таксата за платформата е 0 за този месец. Провери записаните плащания.',
    );
  }

  const customerId = await ensureBillingCustomer(company);

  const existing = await findExistingMonthlyInvoice(
    customerId,
    company.id,
    monthKey,
  );

  if (existing) {
    return {
      invoice: existing,
      summary,
      created: false,
    };
  }

  const payments = await PaymentsRepository.getPaidPaymentsForPeriod(
    company.id,
    start,
    endExclusive,
  );

  if (!payments.length) {
    throw new Error('Няма намерени платени поръчки за този месец');
  }

  const label = monthLabel(monthKey);

  const draftInvoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: 14,
    auto_advance: false,
    currency: 'eur',
    metadata: {
      kind: 'company_monthly_platform_fee',
      companyId: String(company.id),
      invoiceMonth: monthKey,
      paymentsCount: String(summary.paymentsCount),
      grossAmount: summary.grossAmount.toFixed(2),
      platformFee: summary.platformFee.toFixed(2),
      netAmount: summary.netAmount.toFixed(2),
    },
    custom_fields: [
      {
        name: 'Месец',
        value: label,
      },
      {
        name: 'Общ оборот',
        value: `€${summary.grossAmount.toFixed(2)}`,
      },
      {
        name: 'Към платформата',
        value: `€${summary.platformFee.toFixed(2)}`,
      },
      {
        name: 'За фирмата',
        value: `€${summary.netAmount.toFixed(2)}`,
      },
    ],
    description: `Месечна фактура за платформа за ${company.name || company.email}`,
    footer: `Платени резервации: ${summary.paymentsCount} | Общ оборот: €${summary.grossAmount.toFixed(2)} | За фирмата: €${summary.netAmount.toFixed(2)} | Към платформата: €${summary.platformFee.toFixed(2)}`,
  });

  for (const payment of payments) {
    const feeCents = Math.round(Number(payment.platformFee || 0) * 100);

    if (feeCents <= 0) {
      continue;
    }

    const gross = Number(payment.totalPrice || 0);
    const fee = Number(payment.platformFee || 0);
    const net = Number(payment.companyEarnings || 0);

    const carLabel = [payment.make, payment.model, payment.year]
      .filter(Boolean)
      .join(' ');

    const reservationPeriod =
      payment.startDate && payment.endDate
        ? `${new Date(payment.startDate).toLocaleDateString('bg-BG')} - ${new Date(payment.endDate).toLocaleDateString('bg-BG')}`
        : 'Без период';

    const customerLabel =
      payment.userName || payment.userEmail || 'Неизвестен клиент';

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: draftInvoice.id,
      currency: 'eur',
      amount: feeCents,
      description:
        `Резервация #${payment.reservationId} | ` +
        `${carLabel || 'Автомобил'} | ` +
        `${customerLabel} | ` +
        `${reservationPeriod} | ` +
        `Оборот: €${gross.toFixed(2)} | ` +
        `За фирмата: €${net.toFixed(2)} | ` +
        `Такса: €${fee.toFixed(2)}`,
      metadata: {
        kind: 'company_monthly_platform_fee_item',
        companyId: String(company.id),
        invoiceMonth: monthKey,
        paymentId: String(payment.id),
        reservationId: String(payment.reservationId),
        grossAmount: gross.toFixed(2),
        companyEarnings: net.toFixed(2),
        platformFee: fee.toFixed(2),
      },
    });
  }

  const finalizedInvoice = await stripe.invoices.finalizeInvoice(
    draftInvoice.id,
    {
      auto_advance: false,
    },
  );

  return {
    invoice: finalizedInvoice,
    summary,
    created: true,
  };
}
