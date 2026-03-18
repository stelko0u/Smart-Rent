import { query, queryOne } from '@/lib/db';
import { Company } from '@/types/database';

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
