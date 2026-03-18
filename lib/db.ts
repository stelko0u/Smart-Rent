import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

let globalConnection: PoolClient | null = null;

export async function getConnection(): Promise<PoolClient> {
  if (!globalConnection) {
    globalConnection = await pool.connect();
  }
  return globalConnection;
}

export async function closeConnection(): Promise<void> {
  if (globalConnection) {
    globalConnection.release();
    globalConnection = null;
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await getConnection();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await closeConnection();
    }
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;