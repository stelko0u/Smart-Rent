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
