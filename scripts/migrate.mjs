import { readFile,readdir } from 'node:fs/promises';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const directory=new URL('../db/',import.meta.url);
  for(const name of (await readdir(directory)).filter(n=>/^\d+_.*\.sql$/.test(n)).sort()) {
    const client=await pool.connect();
    try {await client.query('BEGIN');await client.query(await readFile(new URL(name,directory),'utf8'));await client.query('COMMIT');console.log(`Migration ${name} appliquée.`);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
} finally { await pool.end(); }
