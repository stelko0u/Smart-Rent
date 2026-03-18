import { query, queryOne } from '@/lib/db';
import { PasswordResetToken } from '@/types/database';

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
