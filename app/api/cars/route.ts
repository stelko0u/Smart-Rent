// import { CarRepository } from '@/lib/repository/CarRepository';
// import { NextResponse } from 'next/server';

// export async function GET(req: Request) {
//   try {
//     const cars = await CarRepository.getAll();
//     return NextResponse.json({ ok: true, cars });
//   } catch (err) {
//     console.error('GET /api/cars error:', err);
//     return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type CarRow = {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number | string;
  ownerId: number;
  images: string[] | null;
  companyId: number | null;
  officeId: number | null;
  createdAt: string;
  updatedAt: string | null;
  carType: string | null;
  transmissionType: string | null;
  fuelType: string | null;
  power: number | string | null;
  displacement: number | string | null;
  companyName: string | null;
  officeName: string | null;
  officeAddress: string | null;
  officeLatitude: number | string | null;
  officeLongitude: number | string | null;
};

type OfficeRow = {
  id: number;
  name: string;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  companyId: number | null;
  companyName: string | null;
};

function isValidDate(value: string | null) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const officeId = searchParams.get('officeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const hasRange = isValidDate(startDate) && isValidDate(endDate);

    const values: any[] = [];
    const whereParts: string[] = [];

    if (officeId) {
      values.push(Number(officeId));
      whereParts.push(`c."officeId" = $${values.length}`);
    }

    if (hasRange) {
      values.push(startDate);
      const startIdx = values.length;

      values.push(endDate);
      const endIdx = values.length;

      // Показва само коли, които НЯМАТ резервация, застъпваща избрания период.
      // Смених имената така, че да са лесни за адаптация:
      // "Reservation", "carId", "startDate", "endDate", "status"
      whereParts.push(`
        NOT EXISTS (
          SELECT 1
          FROM "Reservation" r
          WHERE r."carId" = c.id
            AND r.status NOT IN ('CANCELLED', 'REJECTED', 'EXPIRED')
            AND r."startDate" < $${endIdx}::timestamp
            AND r."endDate" > $${startIdx}::timestamp
        )
      `);
    }

    const whereSql = whereParts.length
      ? `WHERE ${whereParts.join(' AND ')}`
      : '';

    const cars = await query<CarRow>(
      `
      SELECT
        c.*,
        comp.name AS "companyName",
        o.name AS "officeName",
        o.address AS "officeAddress",
        o.latitude AS "officeLatitude",
        o.longitude AS "officeLongitude"
      FROM "Car" c
      LEFT JOIN "Company" comp ON comp.id = c."companyId"
      LEFT JOIN "Office" o ON o.id = c."officeId"
      ${whereSql}
      ORDER BY c.id DESC
      `,
      values,
    );

    const offices = await query<OfficeRow>(`
      SELECT
        o.id,
        o.name,
        o.address,
        o.latitude,
        o.longitude,
        o."companyId",
        comp.name AS "companyName"
      FROM "Office" o
      LEFT JOIN "Company" comp ON comp.id = o."companyId"
      ORDER BY o.name ASC
    `);

    return NextResponse.json({
      ok: true,
      filters: {
        officeId: officeId ? Number(officeId) : null,
        startDate: hasRange ? startDate : null,
        endDate: hasRange ? endDate : null,
      },
      cars,
      offices,
    });
  } catch (err) {
    console.error('GET /api/cars error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}
