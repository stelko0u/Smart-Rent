import { query, queryOne } from '@/lib/db';
import { Office } from '@/types/database';

class OfficeRepository {
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

