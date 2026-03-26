import { query, queryOne } from '@/lib/db';
import { Reservation } from '@/types/database';

export class ReservationRepository {
  static async findById(id: number): Promise<Reservation | null> {
    return queryOne<Reservation>('SELECT * FROM "Reservation" WHERE id = $1', [
      id,
    ]);
  }

  static async create(
    data: Omit<Reservation, 'id' | 'createdAt'>,
  ): Promise<Reservation> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Reservation>(
      `INSERT INTO "Reservation" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async updateStatus(id: number, status: string) {
    return queryOne(
      `
      UPDATE "Reservation"
      SET status = $2, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status],
    );
  }
  static async update(
    id: number,
    data: Partial<Omit<Reservation, 'id' | 'createdAt'>>,
  ): Promise<Reservation | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Reservation>(
      `UPDATE "Reservation" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async findByUser(userId: number): Promise<Reservation[]> {
    return query<Reservation>(
      'SELECT * FROM "Reservation" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId],
    );
  }

  static async findByCar(carId: number): Promise<Reservation[]> {
    return query<Reservation>(
      'SELECT * FROM "Reservation" WHERE "carId" = $1 ORDER BY "createdAt" DESC',
      [carId],
    );
  }

  static async countReservationsByCarId(carId: number): Promise<number> {
    const rows = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM "Reservation" WHERE "carId" = $1',
      [carId],
    );

    return Number(rows[0]?.count ?? 0);
  }

  static async getCompanyDashboardReservations(companyId: number) {
    return query(
      `SELECT 
        r.*, 
        c.make as "carMake", 
        c.model as "carModel", 
        u."name" as "userName", 
        u."email" as "userEmail"
     FROM "Reservation" r
     JOIN "Car" c ON r."carId" = c.id
     LEFT JOIN "User" u ON r."userId" = u.id
     WHERE c."companyId" = $1
     ORDER BY r."createdAt" DESC`,
      [companyId],
    );
  }

  static async getReservationsByCompanyId(companyId: number) {
    return query(
      `SELECT 
      r.*,
      c.id as "carId",
      c.make as "carMake",
      c.model as "carModel",
      r."firstName" || ' ' || r."lastName" as "customerName",
      r.email as "customerEmail",
      r.phone as "customerPhone"
     FROM "Reservation" r
     JOIN "Car" c ON r."carId" = c.id
     WHERE c."companyId" = $1
     ORDER BY r."createdAt" DESC`,
      [companyId],
    );
  }

  static async findConflicting(
    carId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]> {
    return query<Reservation>(
      `SELECT * FROM "Reservation" 
       WHERE "carId" = $1 
       AND status != 'CANCELLED'
       AND (
         ("startDate" <= $2 AND "endDate" >= $2) OR
         ("startDate" <= $3 AND "endDate" >= $3) OR
         ("startDate" >= $2 AND "endDate" <= $3)
       )`,
      [carId, startDate, endDate],
    );
  }

  static async findReservationDetailsByIdAndUserId(
    reservationId: number,
    userId: number,
  ) {
    return query(
      `SELECT 
      r.*,
      c.make as "carMake",
      c.model as "carModel",
      c.images as "carImages",
      c."pricePerDay"
    FROM "Reservation" r
    JOIN "Car" c ON r."carId" = c.id
    WHERE r.id = $1 AND r."userId" = $2`,
      [reservationId, userId],
    );
  }

  static async findReservationOwnerById(reservationId: number) {
    return query(`SELECT id, "userId" FROM "Reservation" WHERE id = $1`, [
      reservationId,
    ]);
  }
}
