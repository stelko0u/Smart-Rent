import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { CarRepository } from '@/lib/repository/CarRepository';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';
import {
  getStripeBalanceSummary,
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

    await processCompletedReservationsForReviewEmails({
      companyId: company.id,
    });

    const allReservations = await query(
      `SELECT r.*, c.make as "carMake", c.model as "carModel", u."name" as "userName", u."email" as "userEmail"
       FROM "Reservation" r
       JOIN "Car" c ON r."carId" = c.id
       LEFT JOIN "User" u ON r."userId" = u.id
       WHERE c."companyId" = $1
       ORDER BY r."createdAt" DESC`,
      [company.id],
    );

    const totalReservations = allReservations.length;
    const pendingReservations = allReservations.filter(
      (r: any) => r.status === 'PENDING' || r.status === 'CONFIRMED',
    ).length;
    const completedReservations = allReservations.filter(
      (r: any) => r.status === 'COMPLETED' || r.status === 'RETURNED',
    ).length;

    const cars = await CarRepository.findByCompany(company.id);
    const totalCars = cars.length;

    let moneySource: 'stripe' | 'database' = 'stripe';
    let totalRevenue = 0;
    let platformFee = 0;
    let companyEarnings = 0;
    let balanceAvailable = 0;
    let balancePending = 0;

    try {
      const stripePayments = await listStripePaymentsForCompany(company);
      const moneySummary = summarizePayments(stripePayments);
      const balance = await getStripeBalanceSummary(company);

      totalRevenue = moneySummary.totalRevenue;
      platformFee = moneySummary.platformFee;
      companyEarnings = moneySummary.companyEarnings;
      balanceAvailable = balance.available;
      balancePending = balance.pending;
    } catch (err) {
      console.error('Stripe dashboard fallback to database:', err);
      moneySource = 'database';

      const paidReservations = allReservations.filter(
        (r: any) => r.paymentStatus === 'PAID',
      );

      totalRevenue = paidReservations.reduce(
        (sum: number, r: any) => sum + parseFloat(r.totalPrice || 0),
        0,
      );

      const feePercent = Number(company.maintenancePercent || 0);
      platformFee = Number(((totalRevenue * feePercent) / 100).toFixed(2));
      companyEarnings = Number((totalRevenue - platformFee).toFixed(2));
      balanceAvailable = companyEarnings;
      balancePending = 0;
    }

    const recentReservations = allReservations.slice(0, 10).map((r: any) => ({
      id: r.id,
      carMake: r.carMake,
      carModel: r.carModel,
      startDate: r.startDate,
      endDate: r.endDate,
      totalPrice: parseFloat(r.totalPrice || 0),
      status: r.status,
      paymentStatus: r.paymentStatus || 'PENDING',
      customerName:
        r.userName ||
        `${r.firstName || ''} ${r.lastName || ''}`.trim() ||
        r.userEmail ||
        'Unknown',
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue,
        platformFee,
        companyEarnings,
        totalReservations,
        pendingReservations,
        completedReservations,
        totalCars,
        balanceAvailable,
        balancePending,
        moneySource,
      },
      recentReservations,
    });
  } catch (err) {
    console.error('GET /api/company/dashboard error:', err);

    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: err.status || 401 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
