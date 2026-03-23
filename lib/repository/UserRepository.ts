import { query, queryOne } from '../db';
import { User } from '@/types/database';

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
    const result = await query(
      'DELETE FROM "User" WHERE id = $1 RETURNING id',
      [id],
    );
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
