import { query, queryOne } from '@/lib/db';
import { Favorite } from '@/types/database';

type FavoriteCarRow = {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: string[] | null;
  carType: string | null;
  transmissionType: string | null;
};

export class FavoriteRepository {
  static async findById(id: number): Promise<Favorite | null> {
    return queryOne<Favorite>('SELECT * FROM "Favorite" WHERE id = $1', [id]);
  }

  static async create(userId: number, carId: number): Promise<Favorite | null> {
    const existing = await queryOne<Favorite>(
      'SELECT * FROM "Favorite" WHERE "userId" = $1 AND "carId" = $2',
      [userId, carId],
    );

    if (existing) {
      return existing;
    }

    return queryOne<Favorite>(
      `INSERT INTO "Favorite" ("userId", "carId")
       VALUES ($1, $2)
       RETURNING *`,
      [userId, carId],
    );
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

  static async findCarsByUser(userId: number): Promise<FavoriteCarRow[]> {
    return query<FavoriteCarRow>(
      `
      SELECT
        c.id,
        c.make,
        c.model,
        c.year,
        c."pricePerDay",
        c.images,
        c."carType",
        c."transmissionType"
      FROM "Favorite" f
      INNER JOIN "Car" c ON c.id = f."carId"
      WHERE f."userId" = $1
      ORDER BY f."createdAt" DESC
      `,
      [userId],
    );
  }
}
