import { query } from '@/lib/db';
import { sendReviewRequestEmail } from '@/lib/mail/sendReviewRequestEmail';

type ProcessOptions = {
  userId?: number;
  companyId?: number;
};

export async function processCompletedReservationsForReviewEmails(
  options: ProcessOptions = {},
) {
  const now = new Date();

  const filters: string[] = [
    `r.status IN ('CONFIRMED', 'IN_PROGRESS')`,
    `r."endDate" < $1`,
    `r."paymentStatus" = 'PAID'`,
  ];

  const params: any[] = [now];
  let paramIndex = 2;

  if (options.userId) {
    filters.push(`r."userId" = $${paramIndex}`);
    params.push(options.userId);
    paramIndex += 1;
  }

  if (options.companyId) {
    filters.push(`c."companyId" = $${paramIndex}`);
    params.push(options.companyId);
    paramIndex += 1;
  }

  const rows = await query<{
    id: number;
    userId: number;
    carId: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date;
    endDate: Date;
    reviewRequestSentAt: Date | null;
    make: string;
    model: string;
    year: number;
  }>(
    `
    UPDATE "Reservation" r
    SET status = 'COMPLETED', "updatedAt" = NOW()
    FROM "Car" c
    WHERE r."carId" = c.id
      AND ${filters.join(' AND ')}
    RETURNING
      r.id,
      r."userId",
      r."carId",
      r."firstName",
      r."lastName",
      r.email,
      r."startDate",
      r."endDate",
      r."reviewRequestSentAt",
      c.make,
      c.model,
      c.year
    `,
    params,
  );

  const selectParams: any[] = [now];
  let selectParamIndex = 2;

  let userFilter = '';
  let companyFilter = '';

  if (options.userId) {
    userFilter = `AND r."userId" = $${selectParamIndex}`;
    selectParams.push(options.userId);
    selectParamIndex += 1;
  }

  if (options.companyId) {
    companyFilter = `AND c."companyId" = $${selectParamIndex}`;
    selectParams.push(options.companyId);
    selectParamIndex += 1;
  }

  const eligible = await query<{
    id: number;
    userId: number;
    carId: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date;
    endDate: Date;
    reviewRequestSentAt: Date | null;
    make: string;
    model: string;
    year: number;
  }>(
    `
    SELECT
      r.id,
      r."userId",
      r."carId",
      r."firstName",
      r."lastName",
      r.email,
      r."startDate",
      r."endDate",
      r."reviewRequestSentAt",
      c.make,
      c.model,
      c.year
    FROM "Reservation" r
    JOIN "Car" c ON c.id = r."carId"
    WHERE r.status = 'COMPLETED'
      AND r."paymentStatus" = 'PAID'
      AND r."endDate" < $1
      AND r."reviewRequestSentAt" IS NULL
      ${userFilter}
      ${companyFilter}
      AND NOT EXISTS (
        SELECT 1
        FROM "Review" rv
        WHERE rv."userId" = r."userId"
          AND rv."carId" = r."carId"
      )
    ORDER BY r."endDate" DESC
    `,
    selectParams,
  );

  let emailsSent = 0;

  for (const reservation of eligible) {
    try {
      await sendReviewRequestEmail({
        reservation: {
          id: reservation.id,
          userId: reservation.userId,
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
          startDate: reservation.startDate,
          endDate: reservation.endDate,
        },
        car: {
          id: reservation.carId,
          make: reservation.make,
          model: reservation.model,
          year: reservation.year,
        },
      });

      await query(
        `UPDATE "Reservation"
         SET "reviewRequestSentAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $1`,
        [reservation.id],
      );

      emailsSent += 1;
    } catch (error) {
      console.error(
        `Failed to send review request email for reservation #${reservation.id}:`,
        error,
      );
    }
  }

  return {
    completedNow: rows.length,
    emailsSent,
  };
}
