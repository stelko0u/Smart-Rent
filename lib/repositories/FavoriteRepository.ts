import { query, queryOne } from '@/lib/db';
import { Favorite } from '@/types/database';

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
