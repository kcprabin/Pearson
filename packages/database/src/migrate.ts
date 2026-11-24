import 'dotenv/config';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Load .env from project root if it exists (local dev)
const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migrate] ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

async function runMigrations() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: false,          // local Postgres has no SSL
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('[migrate] Connected to Postgres ✔');

    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] Migrations applied successfully ✔');
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrate] Migration failed:', err.message);
  // Print the underlying Postgres error if available
  if (err.cause) console.error('[migrate] Cause:', err.cause);
  if (err.detail) console.error('[migrate] Detail:', err.detail);
  process.exit(1);
});
