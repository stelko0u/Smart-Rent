import { query, queryOne } from '@/lib/db';
import { Review, Reservation } from '@/types/database';

export class ReviewRepository {
  static async findById(id: number): Promise<Review | null> {
    return queryOne<Review>('SELECT * FROM "Review" WHERE id = $1', [id]);
  }

  static async create(data: {
    carId: number;
    userId: number;
    rating: number;
    comment: string;
    reservationId?: number;
  }): Promise<any> {
    const result = await queryOne<Review>(
      `INSERT INTO "Review" ("carId", "userId", rating, comment, "reservationId") 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        data.carId,
        data.userId,
        data.rating,
        data.comment,
        data.reservationId || null,
      ],
    );

    // Вземане на данните на потребителя
    const reviewWithUser = await queryOne(
      `SELECT 
        r.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user
      FROM "Review" r
      LEFT JOIN "User" u ON r."userId" = u.id
      WHERE r.id = $1`,
      [result!.id],
    );

    return reviewWithUser;
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

  static async hasUserReviewedReservation(
    userId: number,
    carId: number,
    reservationId: number,
  ): Promise<boolean> {
    const result = await queryOne<Review>(
      `SELECT * FROM "Review" 
       WHERE "userId" = $1 
       AND "carId" = $2 
       AND "reservationId" = $3`,
      [userId, carId, reservationId],
    );
    return !!result;
  }

  static async findUserReservationsForCar(
    userId: number,
    carId: number,
  ): Promise<Reservation[]> {
    return query<Reservation>(
      `SELECT * FROM "Reservation" 
       WHERE "userId" = $1 
       AND "carId" = $2 
       ORDER BY "startDate" DESC`,
      [userId, carId],
    );
  }
}
