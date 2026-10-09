import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { usersTable } from './db/schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}


export const db: NodePgDatabase = drizzle(connectionString);



const run = async () => {
  try {
    await db.insert(usersTable).values({
      name: 'John Doe',
      age: 30,
      email: 'kcprabin@gmail.com',
    });
  } catch (error) {
    console.error('Error inserting user:', error);
  }
};

run();