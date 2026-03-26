import { query, queryOne } from '@/lib/db';

export interface Review {
  id: number;
  userId: number;
  carId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class ReviewRepository {
  static async create(data: {
    userId: number;
    carId: number;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const review = await queryOne<Review>(
      `
      INSERT INTO "Review" (
        "userId",
        "carId",
        rating,
        comment,
        "createdAt"
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING
        id,
        "userId",
        "carId",
        rating,
        comment,
        "createdAt"
      `,
      [data.userId, data.carId, data.rating, data.comment || null],
    );

    if (!review) {
      throw new Error('Failed to create review');
    }
    return review;
  }

  static async hasUserReviewedCar(
    userId: number,
    carId: number,
  ): Promise<boolean> {
    const rows = await query(
      `
      SELECT 1
      FROM "Review"
      WHERE "userId" = $1
        AND "carId" = $2
      LIMIT 1
      `,
      [userId, carId],
    );

    return rows.length > 0;
  }

  static async findByUser(userId: number): Promise<Review[]> {
    return query<Review>(
      `
      SELECT
        id,
        "userId",
        "carId",
        rating,
        comment,
        "createdAt"
      FROM "Review"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      `,
      [userId],
    );
  }

  static async hasUserReviewedReservation(
    userId: number,
    carId: number,
    _reservationId?: number,
  ): Promise<boolean> {
    return this.hasUserReviewedCar(userId, carId);
  }

  static async findByCarId(carId: number): Promise<any[]> {
    return query(
      `
    SELECT
      r.id,
      r."userId",
      r."carId",
      r.rating,
      r.comment,
      r."createdAt",
      u.name as "userName",
      u.email as "userEmail"
    FROM "Review" r
    LEFT JOIN "User" u ON u.id = r."userId"
    WHERE r."carId" = $1
    ORDER BY r."createdAt" DESC
    `,
      [carId],
    );
  }

  static async findAverageRatingByCarId(carId: number): Promise<number> {
    const result = await queryOne<{ average: string | null }>(
      `
      SELECT ROUND(AVG(rating)::numeric, 1)::text AS average
      FROM "Review"
      WHERE "carId" = $1
      `,
      [carId],
    );

    return Number(result?.average || 0);
  }

  static async countByCarId(carId: number): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM "Review"
      WHERE "carId" = $1
      `,
      [carId],
    );

    return Number(result?.count || 0);
  }

  static async findUserReservationsForCar(userId: number, carId: number) {
    return query(
      `
      SELECT
        r.id,
        r."userId",
        r."carId",
        r."startDate",
        r."endDate",
        r.status
      FROM "Reservation" r
      WHERE r."userId" = $1
        AND r."carId" = $2
        AND r.status IN ('CONFIRMED', 'COMPLETED', 'RETURNED')
      ORDER BY r."startDate" DESC
      `,
      [userId, carId],
    );
  }
}
