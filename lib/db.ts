import 'server-only';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
const globalDb = globalThis as unknown as { universityPool?: Pool };
export const db = globalDb.universityPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000,
});
if (!globalDb.universityPool) { attachDatabasePool(db); globalDb.universityPool = db; }
