import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { CarRepository } from '@/lib/repository/CarRepository';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';
import {
  getStripeBalanceSummary,
  listStripePaymentsForCompany,
  summarizePayments,
} from '@/lib/services/stripe/companyFinance';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

type DashboardUser = {
  role: 'COMPANY' | 'ADMIN' | 'USER';
  companyId?: number | null;
};

export async function getCompanyDashboardData(user: DashboardUser) {
  if (!user.companyId) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const company = await CompanyRepository.findById(user.companyId);

  if (!company) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  await processCompletedReservationsForReviewEmails({
    companyId: company.id,
  });

  const [allReservations, cars] = await Promise.all([
    ReservationRepository.getCompanyDashboardReservations(company.id),
    CarRepository.findByCompany(company.id),
  ]);

  const totalReservations = allReservations.length;

  const pendingReservations = allReservations.filter(
    (r: any) => r.status === 'PENDING' || r.status === 'CONFIRMED',
  ).length;

  const completedReservations = allReservations.filter(
    (r: any) => r.status === 'COMPLETED' || r.status === 'RETURNED',
  ).length;

  const totalCars = cars.length;
  const maintenancePercent = Number(company.maintenancePercent || 0);

  const money = await getCompanyMoneyStats(
    company,
    allReservations,
    maintenancePercent,
  );

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

  return {
    stats: {
      totalRevenue: money.totalRevenue,
      platformFee: money.platformFee,
      companyEarnings: money.companyEarnings,
      totalReservations,
      pendingReservations,
      completedReservations,
      totalCars,
      maintenancePercent,
      balanceAvailable: money.balanceAvailable,
      balancePending: money.balancePending,
      moneySource: money.moneySource,
    },
    recentReservations,
  };
}

async function getCompanyMoneyStats(
  company: any,
  allReservations: any[],
  maintenancePercent: number,
) {
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

    platformFee = Number(
      ((totalRevenue * maintenancePercent) / 100).toFixed(2),
    );
    companyEarnings = Number((totalRevenue - platformFee).toFixed(2));
    balanceAvailable = companyEarnings;
    balancePending = 0;
  }

  return {
    moneySource,
    totalRevenue,
    platformFee,
    companyEarnings,
    balanceAvailable,
    balancePending,
  };
}
