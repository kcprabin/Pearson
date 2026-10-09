import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './db/schema';

// Export type alias for the Drizzle Database instance configured with your schema
export type Database = NodePgDatabase<typeof schema>;

/**
 * Factory function to create a new Drizzle client instance connected to PostgreSQL.
 * Pass a database connection string or full node-postgres PoolConfig object.
 */
export const createDbClient = (config: string | PoolConfig): Database => {
  const pool = typeof config === 'string' ? new Pool({ connectionString: config }) : new Pool(config);

  return drizzle(pool, { schema });
};