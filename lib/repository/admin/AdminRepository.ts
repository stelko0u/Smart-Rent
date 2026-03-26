import { query } from '@/lib/db';

export type AdminUserRoleRow = {
  role: string;
};

export type AdminCompanyRow = {
  id: number;
  name: string;
  maintenance_percent: string | number | null;
};

export type AdminReservationRow = {
  id: number;
  total_price: string | number | null;
  status: string;
  created_at: string | Date;
  company_id: number;
  company_name: string;
  maintenance_percent: string | number | null;
};

export async function getAdminUserRoleById(
  userId: number,
): Promise<AdminUserRoleRow[]> {
  return query(`SELECT role FROM "User" WHERE id = $1`, [userId]);
}

export async function getAdminDashboardCompanies(): Promise<AdminCompanyRow[]> {
  return query(`
    SELECT 
      id,
      name,
      "maintenancePercent" as maintenance_percent
    FROM "Company"
    ORDER BY name
  `);
}

export async function getAdminDashboardReservations(): Promise<
  AdminReservationRow[]
> {
  return query(`
    SELECT 
      r.id,
      r."totalPrice" as total_price,
      r.status,
      r."createdAt" as created_at,
      car."companyId" as company_id,
      c.name as company_name,
      c."maintenancePercent" as maintenance_percent
    FROM "Reservation" r
    JOIN "Car" car ON r."carId" = car.id
    JOIN "Company" c ON car."companyId" = c.id
    WHERE r.status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'RETURNED')
    ORDER BY r."createdAt" DESC
  `);
}
