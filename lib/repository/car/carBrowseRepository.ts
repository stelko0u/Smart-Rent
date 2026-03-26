import { query } from '@/lib/db';

export type CarRow = {
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

export type OfficeRow = {
  id: number;
  name: string;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  companyId: number | null;
  companyName: string | null;
};

type GetFilteredCarsParams = {
  officeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  hasRange: boolean;
};

export async function getFilteredCars({
  officeId,
  startDate,
  endDate,
  hasRange,
}: GetFilteredCarsParams): Promise<CarRow[]> {
  const values: any[] = [];
  const whereParts: string[] = [];

  if (officeId) {
    values.push(officeId);
    whereParts.push(`c."officeId" = $${values.length}`);
  }

  if (hasRange && startDate && endDate) {
    values.push(startDate);
    const startIdx = values.length;

    values.push(endDate);
    const endIdx = values.length;

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

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  return query<CarRow>(
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
}

export async function getAllOfficesForCarFilters(): Promise<OfficeRow[]> {
  return query<OfficeRow>(`
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
}
