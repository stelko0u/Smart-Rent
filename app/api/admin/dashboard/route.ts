import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Неоторизиран достъп' },
        { status: 401 },
      );
    }

    let decoded: any;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Невалиден токен' }, { status: 401 });
    }

    const userResult = await query(`SELECT role FROM "User" WHERE id = $1`, [
      decoded.userId,
    ]);

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'Потребителят не съществува' },
        { status: 403 },
      );
    }

    const user = userResult[0];

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Нямате права за достъп' },
        { status: 403 },
      );
    }

    const companies = await query(
      `SELECT id, name FROM "Company" ORDER BY name`,
    );

    const reservations = await query(`
      SELECT 
        r.id,
        r."totalPrice" as total_price,
        r.status,
        r."createdAt" as created_at,
        car."companyId" as company_id,
        c.name as company_name
      FROM "Reservation" r
      JOIN "Car" car ON r."carId" = car.id
      JOIN "Company" c ON car."companyId" = c.id
      WHERE r.status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
      ORDER BY r."createdAt" DESC
    `);

    let totalRevenue = 0;
    let platformRevenue = 0;
    let monthlyRevenue = 0;
    let monthlyPlatformRevenue = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const companiesStatsMap = new Map();

    companies.forEach((company: any) => {
      companiesStatsMap.set(company.id, {
        id: company.id,
        name: company.name,
        reservationsCount: 0,
        revenue: 0,
        platformFee: 0,
        monthlyRevenue: 0,
        monthlyPlatformFee: 0,
      });
    });

    reservations.forEach((reservation: any) => {
      const totalPrice = parseFloat(reservation.total_price) || 0;
      const feePercent = Number(reservation.platform_fee_percent ?? 0);
      const platformFee = totalPrice * (feePercent / 100);
      const companyRevenue = totalPrice - platformFee;

      // Общи статистики
      totalRevenue += companyRevenue;
      platformRevenue += platformFee;

      // Месечни статистики
      const reservationDate = new Date(reservation.created_at);
      const isCurrentMonth = reservationDate >= monthStart;

      if (isCurrentMonth) {
        monthlyRevenue += companyRevenue;
        monthlyPlatformRevenue += platformFee;
      }

      // Статистики по компания
      const companyId = reservation.company_id;
      if (companiesStatsMap.has(companyId)) {
        const companyStats = companiesStatsMap.get(companyId);
        companyStats.reservationsCount += 1;
        companyStats.revenue += companyRevenue;
        companyStats.platformFee += platformFee;

        if (isCurrentMonth) {
          companyStats.monthlyRevenue += companyRevenue;
          companyStats.monthlyPlatformFee += platformFee;
        }
      }
    });

    // Преобразуваме Map в масив и форматираме числата
    const companiesStats = Array.from(companiesStatsMap.values())
      .map((stats: any) => ({
        id: stats.id,
        name: stats.name,
        reservationsCount: stats.reservationsCount,
        revenue: stats.revenue.toFixed(2),
        platformFee: stats.platformFee.toFixed(2),
        monthlyRevenue: stats.monthlyRevenue.toFixed(2),
        monthlyPlatformFee: stats.monthlyPlatformFee.toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const stats = {
      totalCompanies: companies.length,
      totalReservations: reservations.length,
      totalRevenue: totalRevenue,
      platformRevenue: platformRevenue,
      monthlyRevenue: monthlyRevenue,
      monthlyPlatformRevenue: monthlyPlatformRevenue,
      companiesStats: companiesStats,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на статистиките' },
      { status: 500 },
    );
  }
}
