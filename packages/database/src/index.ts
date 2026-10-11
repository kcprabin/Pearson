import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

export * as schema from './db/schema.js';
export const createDBConnection = (connectionString: string): NodePgDatabase<typeof schema> => {
  return drizzle(connectionString, { schema });
};



