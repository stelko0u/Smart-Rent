import {
  getAdminDashboardCompanies,
  getAdminDashboardReservations,
} from '@/lib/repository/admin/AdminRepository';

type CompanyStats = {
  id: number;
  name: string;
  reservationsCount: number;
  revenue: number;
  platformFee: number;
  monthlyRevenue: number;
  monthlyPlatformFee: number;
};

export async function getAdminDashboardStats() {
  const [companies, reservations] = await Promise.all([
    getAdminDashboardCompanies(),
    getAdminDashboardReservations(),
  ]);

  let totalRevenue = 0;
  let platformRevenue = 0;
  let monthlyRevenue = 0;
  let monthlyPlatformRevenue = 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const companiesStatsMap = new Map<number, CompanyStats>();

  for (const company of companies) {
    companiesStatsMap.set(company.id, {
      id: company.id,
      name: company.name,
      reservationsCount: 0,
      revenue: 0,
      platformFee: 0,
      monthlyRevenue: 0,
      monthlyPlatformFee: 0,
    });
  }

  for (const reservation of reservations) {
    const totalPrice = Number(reservation.total_price ?? 0);
    const feePercent = Number(reservation.maintenance_percent ?? 0);
    const platformFee = Number(((totalPrice * feePercent) / 100).toFixed(2));
    const companyRevenue = Number((totalPrice - platformFee).toFixed(2));

    totalRevenue += companyRevenue;
    platformRevenue += platformFee;

    const reservationDate = new Date(reservation.created_at);
    const isCurrentMonth = reservationDate >= monthStart;

    if (isCurrentMonth) {
      monthlyRevenue += companyRevenue;
      monthlyPlatformRevenue += platformFee;
    }

    const companyStats = companiesStatsMap.get(reservation.company_id);
    if (!companyStats) continue;

    companyStats.reservationsCount += 1;
    companyStats.revenue += companyRevenue;
    companyStats.platformFee += platformFee;

    if (isCurrentMonth) {
      companyStats.monthlyRevenue += companyRevenue;
      companyStats.monthlyPlatformFee += platformFee;
    }
  }

  const companiesStats = Array.from(companiesStatsMap.values())
    .map((stats) => ({
      id: stats.id,
      name: stats.name,
      reservationsCount: stats.reservationsCount,
      revenue: stats.revenue.toFixed(2),
      platformFee: stats.platformFee.toFixed(2),
      monthlyRevenue: stats.monthlyRevenue.toFixed(2),
      monthlyPlatformFee: stats.monthlyPlatformFee.toFixed(2),
    }))
    .sort((a, b) => Number(b.revenue) - Number(a.revenue));

  return {
    totalCompanies: companies.length,
    totalReservations: reservations.length,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    platformRevenue: Number(platformRevenue.toFixed(2)),
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    monthlyPlatformRevenue: Number(monthlyPlatformRevenue.toFixed(2)),
    companiesStats,
  };
}
