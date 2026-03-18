import { Pool, PoolClient } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Database client singleton
const dbClientSingleton = () => {
  return pool;
};

declare const globalThis: {
  dbGlobal: ReturnType<typeof dbClientSingleton>;
} & typeof global;

const db = globalThis.dbGlobal ?? dbClientSingleton();

export default db;

export class DatabaseService {
  static async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      // SHOW IN CONSOLE WHAT QUERY WAS EXECUTED
      return result.rows;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }

  // Execute a query and return the first row
  static async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // Execute a query and return a single value
  static async queryScalar(text: string, params?: any[]): Promise<any> {
    const row = await this.queryOne(text, params);
    return row ? Object.values(row)[0] : null;
  }

  // Insert a record and return it
  static async insert<T = any>(table: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query<T>(query, values);
    return result[0];
  }

  // Update records and return them
  static async update<T = any>(
    table: string, 
    where: string, 
    whereParams: any[], 
    data: Partial<T>
  ): Promise<T[]> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE "${table}"
      SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE ${where}
      RETURNING *
    `;
    
    return await this.query<T>(query, [...values, ...whereParams]);
  }

  // Update a single record and return it
  static async updateOne<T = any>(
    table: string, 
    where: string, 
    whereParams: any[], 
    data: Partial<T>
  ): Promise<T | null> {
    const result = await this.update<T>(table, where, whereParams, data);
    return result.length > 0 ? result[0] : null;
  }

  // Delete records
  static async delete(table: string, where: string, params: any[]): Promise<number> {
    const query = `DELETE FROM "${table}" WHERE ${where}`;
    const result = await pool.query(query, params);
    return result.rowCount || 0;
  }

  // Begin a transaction
  static async beginTransaction(): Promise<PoolClient> {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
  }

  // Commit a transaction
  static async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  // Rollback a transaction
  static async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}

// Export types for database records
export type User = {
  id: number;
  email: string;
  password: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'COMPANY';
  createdAt: Date;
  updatedAt?: Date;
  emailVerified: boolean;
  companyId?: number;
};

export type Company = {
  id: number;
  name?: string;
  email: string;
  maintenancePercent: number;
  ownerId: number;
  createdAt: Date;
  updatedAt?: Date;
};

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  ownerId: number;
  images: string[];
  companyId?: number;
  officeId?: number;
  createdAt: Date;
  updatedAt?: Date;
  carType: 'SEDAN' | 'HATCHBACK' | 'SUV' | 'COUPE' | 'CONVERTIBLE' | 'CABRIO' | 'WAGON' | 'VAN' | 'PICKUP' | 'COMBI' | 'OTHER';
  transmissionType: 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'OTHER';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRICITY';
  company?: Company;
  office?: Office;
};

export type Office = {
  id: number;
  companyId: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt?: Date;
};

export type Reservation = {
  id: number;
  userId?: number | null;
  carId: number;
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'RETURNED' | 'CANCELLED';
  createdAt: Date;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type Review = {
  id: number;
  userId: number;
  carId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
};

export type PasswordResetToken = {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

if (process.env.NODE_ENV !== 'production') globalThis.dbGlobal = db;