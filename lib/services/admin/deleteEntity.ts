import { transaction } from '@/lib/db';

async function deleteCarsDeep(
  client: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  },
  carIds: number[],
) {
  if (carIds.length === 0) return;

  await client.query('DELETE FROM "Favorite" WHERE "carId" = ANY($1::int[])', [
    carIds,
  ]);

  await client.query('DELETE FROM "Review" WHERE "carId" = ANY($1::int[])', [
    carIds,
  ]);

  const reservationIdsRes = await client.query(
    'SELECT id FROM "Reservation" WHERE "carId" = ANY($1::int[])',
    [carIds],
  );
  const reservationIds = reservationIdsRes.rows.map((row) => Number(row.id));

  if (reservationIds.length > 0) {
    await client.query(
      'DELETE FROM "Payments" WHERE "reservationId" = ANY($1::int[])',
      [reservationIds],
    );

    await client.query(
      'DELETE FROM "Review" WHERE "reservationId" = ANY($1::int[])',
      [reservationIds],
    );

    await client.query('DELETE FROM "Reservation" WHERE id = ANY($1::int[])', [
      reservationIds,
    ]);
  }

  await client.query('DELETE FROM "Car" WHERE id = ANY($1::int[])', [carIds]);
}

async function getCarIdsForCompanyOrOwner(
  client: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  },
  companyId?: number | null,
  ownerId?: number | null,
) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (companyId != null) {
    params.push(companyId);
    conditions.push(`"companyId" = $${params.length}`);
  }

  if (ownerId != null) {
    params.push(ownerId);
    conditions.push(`"ownerId" = $${params.length}`);
  }

  if (conditions.length === 0) return [];

  const sql = `
    SELECT DISTINCT id
    FROM "Car"
    WHERE ${conditions.join(' OR ')}
  `;

  const res = await client.query(sql, params);
  return res.rows.map((row) => Number(row.id));
}

export async function deleteCompanyDeep(companyId: number) {
  return transaction(async (client) => {
    const companyRes = await client.query(
      'SELECT * FROM "Company" WHERE id = $1',
      [companyId],
    );

    const company = companyRes.rows[0];
    if (!company) {
      throw new Error('company_not_found');
    }

    const ownerId = company.ownerId ? Number(company.ownerId) : null;

    const carIds = await getCarIdsForCompanyOrOwner(client, companyId, ownerId);
    await deleteCarsDeep(client, carIds);

    await client.query('DELETE FROM "Payments" WHERE "companyId" = $1', [
      companyId,
    ]);

    await client.query('DELETE FROM "Office" WHERE "companyId" = $1', [
      companyId,
    ]);

    await client.query('DELETE FROM "Company" WHERE id = $1', [companyId]);

    if (ownerId) {
      const userReservationIdsRes = await client.query(
        'SELECT id FROM "Reservation" WHERE "userId" = $1',
        [ownerId],
      );
      const userReservationIds = userReservationIdsRes.rows.map((row) =>
        Number(row.id),
      );

      await client.query('DELETE FROM "Favorite" WHERE "userId" = $1', [
        ownerId,
      ]);

      await client.query('DELETE FROM "Review" WHERE "userId" = $1', [ownerId]);

      if (userReservationIds.length > 0) {
        await client.query(
          'DELETE FROM "Payments" WHERE "reservationId" = ANY($1::int[])',
          [userReservationIds],
        );

        await client.query(
          'DELETE FROM "Review" WHERE "reservationId" = ANY($1::int[])',
          [userReservationIds],
        );

        await client.query(
          'DELETE FROM "Reservation" WHERE id = ANY($1::int[])',
          [userReservationIds],
        );
      }

      await client.query('DELETE FROM "User" WHERE id = $1', [ownerId]);
    }

    return { companyId, ownerId };
  });
}

export async function deleteUserDeep(userId: number) {
  return transaction(async (client) => {
    const userRes = await client.query('SELECT * FROM "User" WHERE id = $1', [
      userId,
    ]);

    const user = userRes.rows[0];
    if (!user) {
      throw new Error('user_not_found');
    }

    if (user.role === 'ADMIN') {
      throw new Error('cannot_delete_admin');
    }

    const companyRes = await client.query(
      'SELECT id FROM "Company" WHERE "ownerId" = $1',
      [userId],
    );
    const company = companyRes.rows[0];
    const companyId = company ? Number(company.id) : null;

    // Много важно: чистим всички коли, вързани или към компанията, или към ownerId=userId
    const carIds = await getCarIdsForCompanyOrOwner(client, companyId, userId);
    await deleteCarsDeep(client, carIds);

    if (companyId) {
      await client.query('DELETE FROM "Payments" WHERE "companyId" = $1', [
        companyId,
      ]);

      await client.query('DELETE FROM "Office" WHERE "companyId" = $1', [
        companyId,
      ]);

      await client.query('DELETE FROM "Company" WHERE id = $1', [companyId]);
    }

    const reservationIdsRes = await client.query(
      'SELECT id FROM "Reservation" WHERE "userId" = $1',
      [userId],
    );
    const reservationIds = reservationIdsRes.rows.map((row) => Number(row.id));

    await client.query('DELETE FROM "Favorite" WHERE "userId" = $1', [userId]);

    await client.query('DELETE FROM "Review" WHERE "userId" = $1', [userId]);

    if (reservationIds.length > 0) {
      await client.query(
        'DELETE FROM "Payments" WHERE "reservationId" = ANY($1::int[])',
        [reservationIds],
      );

      await client.query(
        'DELETE FROM "Review" WHERE "reservationId" = ANY($1::int[])',
        [reservationIds],
      );

      await client.query(
        'DELETE FROM "Reservation" WHERE id = ANY($1::int[])',
        [reservationIds],
      );
    }

    await client.query('DELETE FROM "User" WHERE id = $1', [userId]);

    return { userId };
  });
}
