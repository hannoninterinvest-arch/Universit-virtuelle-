import { readFile } from 'node:fs/promises';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try { await pool.query(await readFile(new URL('../db/001_admissions.sql', import.meta.url), 'utf8')); console.log('Schéma admissions prêt.'); } finally { await pool.end(); }
