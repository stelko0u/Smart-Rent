import { query, queryOne } from '../db';
import { Car } from '@/types/database';

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
