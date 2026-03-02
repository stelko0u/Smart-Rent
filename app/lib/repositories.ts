import { query, queryOne, transaction } from './db';
import {
  User,
  Company,
  Car,
  Reservation,
  Review,
  Office,
  PasswordResetToken,
  Payment,
  Favorite,
} from '../types/database';

export class UserRepository {
  static async findById(id: number): Promise<User | null> {
    return queryOne<User>('SELECT * FROM "User" WHERE id = $1', [id]);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM "User" WHERE email = $1', [email]);
  }

  static async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<User>(
      `INSERT INTO "User" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): Promise<User | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<User>(
      `UPDATE "User" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM "User" WHERE id = $1', [id]);
    return result.length > 0;
  }

  static async findMany(where?: Partial<User>): Promise<User[]> {
    if (!where) return query<User>('SELECT * FROM "User"');

    const entries = Object.entries(where);
    const whereClause = entries
      .map(([key, _], i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = entries.map(([_, value]) => value);

    return query<User>(`SELECT * FROM "User" WHERE ${whereClause}`, values);
  }

  static async ban(id: number, reason?: string): Promise<User | null> {
    return queryOne<User>(
      `UPDATE "User" SET banned = true, "bannedAt" = NOW(), "banReason" = $2, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [id, reason || null],
    );
  }

  static async unban(id: number): Promise<User | null> {
    return queryOne<User>(
      `UPDATE "User" SET banned = false, "bannedAt" = NULL, "banReason" = NULL, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
  }

  static async isBanned(id: number): Promise<boolean> {
    const user = await queryOne<{ banned: boolean }>(
      'SELECT banned FROM "User" WHERE id = $1',
      [id],
    );
    return user?.banned || false;
  }
}

export class CompanyRepository {
  static async findById(id: number): Promise<Company | null> {
    return queryOne<Company>('SELECT * FROM "Company" WHERE id = $1', [id]);
  }

  static async findByEmail(email: string): Promise<Company | null> {
    return queryOne<Company>('SELECT * FROM "Company" WHERE email = $1', [
      email,
    ]);
  }

  static async create(
    data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Company> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Company>(
      `INSERT INTO "Company" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Company, 'id' | 'createdAt'>>,
  ): Promise<Company | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Company>(
      `UPDATE "Company" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM "Company" WHERE id = $1', [id]);
    return result.length > 0;
  }

  static async findMany(where?: Partial<Company>): Promise<Company[]> {
    if (!where) return query<Company>('SELECT * FROM "Company"');

    const entries = Object.entries(where);
    const whereClause = entries
      .map(([key, _], i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = entries.map(([_, value]) => value);

    return query<Company>(
      `SELECT * FROM "Company" WHERE ${whereClause}`,
      values,
    );
  }
}

export class CarRepository {
  static async findById(id: number): Promise<Car | null> {
    return queryOne<Car>('SELECT * FROM "Car" WHERE id = $1', [id]);
  }

  static async getAll(): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car"');
  }

  static async create(
    data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Car> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Car>(
      `INSERT INTO "Car" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Car, 'id' | 'createdAt'>>,
  ): Promise<Car | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Car>(
      `UPDATE "Car" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async findMany(where?: Partial<Car>): Promise<Car[]> {
    if (!where) return query<Car>('SELECT * FROM "Car"');

    const entries = Object.entries(where);
    const whereClause = entries
      .map(([key, _], i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = entries.map(([_, value]) => value);

    return query<Car>(`SELECT * FROM "Car" WHERE ${whereClause}`, values);
  }

  static async findByOwner(ownerId: number): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car" WHERE "ownerId" = $1', [ownerId]);
  }

  static async findByCompany(companyId: number): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car" WHERE "companyId" = $1', [
      companyId,
    ]);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM "Car" WHERE id = $1', [id]);
    return result.length > 0;
  }
  static async hasReservations(carId: number): Promise<boolean> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM "Reservation" WHERE "carId" = $1',
      [carId],
    );
    return parseInt(result[0]?.count || '0', 10) > 0;
  }
}

export class ReservationRepository {
  static async findById(id: number): Promise<Reservation | null> {
    return queryOne<Reservation>('SELECT * FROM "Reservation" WHERE id = $1', [
      id,
    ]);
  }

  static async create(
    data: Omit<Reservation, 'id' | 'createdAt'>,
  ): Promise<Reservation> {
    // Properly quote field names for PostgreSQL
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

  static async update(
    id: number,
    data: Partial<Omit<Reservation, 'id' | 'createdAt'>>,
  ): Promise<Reservation | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    // Properly quote field names for PostgreSQL
    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Reservation>(
      `UPDATE "Reservation" SET ${setClause} WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async findByUser(userId: number): Promise<Reservation[]> {
    return query<Reservation>(
      'SELECT * FROM "Reservation" WHERE "userId" = $1',
      [userId],
    );
  }

  static async findByCar(carId: number): Promise<Reservation[]> {
    return query<Reservation>(
      'SELECT * FROM "Reservation" WHERE "carId" = $1',
      [carId],
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
       AND (("startDate" <= $2 AND "endDate" >= $2) 
            OR ("startDate" <= $3 AND "endDate" >= $3)
            OR ("startDate" >= $2 AND "endDate" <= $3))
       AND status NOT IN ('CANCELLED', 'COMPLETED', 'RETURNED')`,
      [carId, startDate, endDate],
    );
  }
}

export class ReviewRepository {
  static async findById(id: number): Promise<Review | null> {
    return queryOne<Review>('SELECT * FROM "Review" WHERE id = $1', [id]);
  }

  static async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Review>(
      `INSERT INTO "Review" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async findByCar(carId: number): Promise<any[]> {
    return query(
      `SELECT 
        r.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user
      FROM "Review" r
      LEFT JOIN "User" u ON r."userId" = u.id
      WHERE r."carId" = $1 
      ORDER BY r."createdAt" DESC`,
      [carId],
    );
  }

  static async findByUser(userId: number): Promise<Review[]> {
    return query<Review>(
      'SELECT * FROM "Review" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId],
    );
  }
}

export class PaymentRepository {
  static async findById(id: number): Promise<Payment | null> {
    return queryOne<Payment>('SELECT * FROM "Payment" WHERE id = $1', [id]);
  }

  static async create(
    data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Payment> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Payment>(
      `INSERT INTO "Payment" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Payment, 'id' | 'createdAt'>>,
  ): Promise<Payment | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Payment>(
      `UPDATE "Payment" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async findByReservation(
    reservationId: number,
  ): Promise<Payment | null> {
    return queryOne<Payment>(
      'SELECT * FROM "Payment" WHERE "reservationId" = $1',
      [reservationId],
    );
  }

  static async findByCompany(companyId: number): Promise<Payment[]> {
    return query<Payment>(
      'SELECT * FROM "Payment" WHERE "companyId" = $1 ORDER BY "createdAt" DESC',
      [companyId],
    );
  }

  static async getTotalEarnings(companyId: number): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM("companyEarnings"), 0) as total 
       FROM "Payment" 
       WHERE "companyId" = $1 AND "paymentStatus" = 'PAID'`,
      [companyId],
    );
    return result ? parseFloat(result.total) : 0;
  }

  static async getEarningsByDateRange(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Payment[]> {
    return query<Payment>(
      `SELECT * FROM "Payment" 
       WHERE "companyId" = $1 
       AND "paidAt" BETWEEN $2 AND $3 
       AND "paymentStatus" = 'PAID'
       ORDER BY "paidAt" DESC`,
      [companyId, startDate, endDate],
    );
  }
}

export class OfficeRepository {
  static async findById(id: number): Promise<Office | null> {
    return queryOne<Office>('SELECT * FROM "Office" WHERE id = $1', [id]);
  }

  static async create(
    data: Omit<Office, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Office> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Office>(
      `INSERT INTO "Office" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Office, 'id' | 'createdAt'>>,
  ): Promise<Office | null> {
    const entries = Object.entries(data);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key, _], i) => `"${key}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([_, value]) => value)];

    return queryOne<Office>(
      `UPDATE "Office" SET ${setClause}, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
  }

  static async findByCompany(companyId: number): Promise<Office[]> {
    return query<Office>('SELECT * FROM "Office" WHERE "companyId" = $1', [
      companyId,
    ]);
  }

  static async findMany(where?: Partial<Office>): Promise<Office[]> {
    if (!where) return query<Office>('SELECT * FROM "Office"');

    const entries = Object.entries(where);
    const whereClause = entries
      .map(([key, _], i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = entries.map(([_, value]) => value);

    return query<Office>(`SELECT * FROM "Office" WHERE ${whereClause}`, values);
  }
}

export class PasswordResetTokenRepository {
  static async create(
    data: Omit<PasswordResetToken, 'createdAt'>,
  ): Promise<PasswordResetToken> {
    const result = await queryOne<PasswordResetToken>(
      `INSERT INTO "PasswordResetToken" (id, email, token, "expiresAt") 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [data.id, data.email, data.token, data.expiresAt],
    );
    return result!;
  }

  static async findByToken(token: string): Promise<PasswordResetToken | null> {
    return queryOne<PasswordResetToken>(
      'SELECT * FROM "PasswordResetToken" WHERE token = $1',
      [token],
    );
  }

  static async deleteByEmail(email: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM "PasswordResetToken" WHERE email = $1',
      [email],
    );
    return result.length > 0;
  }

  static async deleteByToken(token: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM "PasswordResetToken" WHERE token = $1',
      [token],
    );
    return result.length > 0;
  }

  static async deleteExpired(): Promise<boolean> {
    const result = await query(
      'DELETE FROM "PasswordResetToken" WHERE "expiresAt" < NOW()',
      [],
    );
    return result.length > 0;
  }
}

export class FavoriteRepository {
  static async findById(id: number): Promise<Favorite | null> {
    return queryOne<Favorite>('SELECT * FROM "Favorite" WHERE id = $1', [id]);
  }

  static async create(userId: number, carId: number): Promise<Favorite | null> {
    const result = await queryOne<Favorite>(
      `INSERT INTO "Favorite" ("userId", "carId") VALUES ($1, $2) 
       ON CONFLICT ("userId", "carId") DO NOTHING 
       RETURNING *`,
      [userId, carId],
    );
    return result;
  }

  static async delete(userId: number, carId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM "Favorite" WHERE "userId" = $1 AND "carId" = $2 RETURNING *',
      [userId, carId],
    );
    return result.length > 0;
  }

  static async findByUser(userId: number): Promise<Favorite[]> {
    return query<Favorite>(
      'SELECT * FROM "Favorite" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId],
    );
  }

  static async isFavorite(userId: number, carId: number): Promise<boolean> {
    const result = await queryOne<Favorite>(
      'SELECT * FROM "Favorite" WHERE "userId" = $1 AND "carId" = $2',
      [userId, carId],
    );
    return !!result;
  }
}
