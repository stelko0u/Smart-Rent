import { query, queryOne } from '@/lib/db';
import { Payments } from '@/types/database';

export class PaymentsRepository {
  static async findById(id: number): Promise<Payments | null> {
    return queryOne<Payments>('SELECT * FROM "Payments" WHERE id = $1', [id]);
  }

  static async create(
    data: Omit<Payments, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Payments> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Payments>(
      `INSERT INTO "Payments" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Payments, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Payments | null> {
    console.log('PaymentsRepository.update called with:', { id, data });

    try {
      const fields = Object.keys(data)
        .map((key, i) => `"${key}" = $${i + 2}`)
        .join(', ');
      const values = [id, ...Object.values(data)];

      console.log('Update SQL fields:', fields);
      console.log('Update SQL values:', values);

      const query = `
        UPDATE "Payments" 
        SET ${fields}, "updatedAt" = NOW() 
        WHERE id = $1 
        RETURNING *
      `;

      console.log('Update SQL query:', query);

      const result = await queryOne<Payments>(query, values);
      console.log('Payment updated successfully:', result);

      return result;
    } catch (err) {
      console.error('Error in PaymentsRepository.update:', err);
      throw err;
    }
  }

  static async findByReservation(
    reservationId: number,
  ): Promise<Payments | null> {
    return queryOne<Payments>(
      'SELECT * FROM "Payments" WHERE "reservationId" = $1',
      [reservationId],
    );
  }

  static async getMonthlyPlatformFeeSummary(
    companyId: number,
    periodStart: Date,
    periodEndExclusive: Date,
  ): Promise<{
    paymentsCount: number;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
  }> {
    const result = await queryOne<{
      paymentsCount: string;
      grossAmount: string;
      platformFee: string;
      netAmount: string;
    }>(
      `
      SELECT
        COUNT(*)::text as "paymentsCount",
        COALESCE(SUM("totalPrice"), 0)::text as "grossAmount",
        COALESCE(SUM("platformFee"), 0)::text as "platformFee",
        COALESCE(SUM("companyEarnings"), 0)::text as "netAmount"
      FROM "Payments"
      WHERE "companyId" = $1
        AND "paymentStatus" = 'PAID'
        AND COALESCE("paidAt", "createdAt") >= $2
        AND COALESCE("paidAt", "createdAt") < $3
      `,
      [companyId, periodStart, periodEndExclusive],
    );

    return {
      paymentsCount: Number(result?.paymentsCount ?? 0),
      grossAmount: Number(result?.grossAmount ?? 0),
      platformFee: Number(result?.platformFee ?? 0),
      netAmount: Number(result?.netAmount ?? 0),
    };
  }

  static async getPaidPaymentsForPeriod(
    companyId: number,
    periodStart: Date,
    periodEndExclusive: Date,
  ): Promise<any[]> {
    return query(
      `
    SELECT
      p.*,
      r."startDate",
      r."endDate",
      c.make,
      c.model,
      c.year,
      u.name as "userName",
      u.email as "userEmail"
    FROM "Payments" p
    LEFT JOIN "Reservation" r ON p."reservationId" = r.id
    LEFT JOIN "Car" c ON r."carId" = c.id
    LEFT JOIN "User" u ON r."userId" = u.id
    WHERE p."companyId" = $1
      AND p."paymentStatus" = 'PAID'
      AND COALESCE(p."paidAt", p."createdAt") >= $2
      AND COALESCE(p."paidAt", p."createdAt") < $3
    ORDER BY COALESCE(p."paidAt", p."createdAt") ASC
    `,
      [companyId, periodStart, periodEndExclusive],
    );
  }

  static async getMonthlySalesSummaryByMonthKey(
    companyId: number,
    invoiceMonth: string,
  ): Promise<{
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    paymentsCount: number;
  }> {
    const [year, month] = invoiceMonth.split('-').map(Number);

    const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const periodEndExclusive = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const result = await queryOne<{
      grossAmount: string;
      platformFee: string;
      netAmount: string;
      paymentsCount: string;
    }>(
      `
      SELECT
        COALESCE(SUM("totalPrice"), 0)::text as "grossAmount",
        COALESCE(SUM("platformFee"), 0)::text as "platformFee",
        COALESCE(SUM("companyEarnings"), 0)::text as "netAmount",
        COUNT(*)::text as "paymentsCount"
      FROM "Payments"
      WHERE "companyId" = $1
        AND "paymentStatus" = 'PAID'
        AND COALESCE("paidAt", "createdAt") >= $2
        AND COALESCE("paidAt", "createdAt") < $3
    `,
      [companyId, periodStart, periodEndExclusive],
    );

    return {
      grossAmount: Number(result?.grossAmount ?? 0),
      platformFee: Number(result?.platformFee ?? 0),
      netAmount: Number(result?.netAmount ?? 0),
      paymentsCount: Number(result?.paymentsCount ?? 0),
    };
  }

  static async findByStripePaymentIntent(
    paymentIntentId: string,
  ): Promise<Payments | null> {
    return queryOne<Payments>(
      'SELECT * FROM "Payments" WHERE "stripePaymentIntentId" = $1',
      [paymentIntentId],
    );
  }

  static async findByCompany(companyId: number): Promise<any[]> {
    return query(
      `SELECT 
        p.*,
        r."startDate",
        r."endDate",
        r."totalPrice" as "reservationTotalPrice",
        c.make,
        c.model,
        c.year,
        u.name as "userName",
        u.email as "userEmail"
      FROM "Payments" p
      LEFT JOIN "Reservation" r ON p."reservationId" = r.id
      LEFT JOIN "Car" c ON r."carId" = c.id
      LEFT JOIN "User" u ON r."userId" = u.id
      WHERE p."companyId" = $1  
      ORDER BY p."createdAt" DESC`,
      [companyId],
    );
  }

  static async getTotalEarnings(companyId: number): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT COALESCE(SUM("companyEarnings"), 0) as total 
       FROM "Payments" 
       WHERE "companyId" = $1 AND "paymentStatus" = 'PAID'`,
      [companyId],
    );
    return result[0] ? parseFloat(result[0].total) : 0;
  }

  static async getEarningsByDateRange(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Payments[]> {
    return query<Payments>(
      `SELECT * FROM "Payments" 
       WHERE "companyId" = $1 
       AND "createdAt" >= $2 
       AND "createdAt" <= $3
       ORDER BY "createdAt" DESC`,
      [companyId, startDate, endDate],
    );
  }
}
