import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import {
  listStripePaymentsForCompany,
  summarizePayments,
} from '@/lib/services/stripe/companyFinance';
import { buildReportPdf } from '@/lib/pdf/companyReportPdf';

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

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

    const url = new URL(req.url);
    const startDate = parseDate(url.searchParams.get('startDate'));
    const endDate = parseDate(url.searchParams.get('endDate'), true);
    const format = url.searchParams.get('format');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: 'startDate and endDate are required' },
        { status: 400 },
      );
    }

    const payments = await listStripePaymentsForCompany(
      company,
      startDate,
      endDate,
    );

    const summary = summarizePayments(payments);

    const reportData = {
      companyName: company.name || company.email || `Company #${company.id}`,
      startDate,
      endDate,
      summary,
      items: payments.map((item) => ({
        reservationId: item.reservationId ?? null,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
        carLabel: item.carLabel || '',
        amount: Number(item.amount || 0),
        platformFee: Number(item.platformFee || 0),
        companyEarnings: Number(item.companyEarnings || 0),
        paidAt: item.paidAt,
      })),
    };

    if (format === 'pdf') {
      const pdfBuffer = await buildReportPdf(reportData);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="company-report-${company.id}-${url.searchParams.get('startDate')}-${url.searchParams.get('endDate')}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      source: 'stripe',
      summary: {
        ...reportData.summary,
        paymentsCount: reportData.items.length,
      },
      items: reportData.items,
      company: {
        id: company.id,
        name: company.name || null,
        email: company.email || null,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('GET /api/company/reports error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate report' },
      { status: 500 },
    );
  }
}
