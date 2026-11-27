import pg from 'pg';
const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error('Usage : npm run admin:grant -- adresse@example.com');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const { rows } = await pool.query('INSERT INTO university.staff_members(user_id) SELECT id FROM neon_auth."user" WHERE lower(email) = $1 AND "emailVerified" = true ON CONFLICT DO NOTHING RETURNING user_id', [email]);
  if (!rows.length) throw new Error('Compte introuvable, adresse non vérifiée ou accès déjà attribué.');
  console.log('Accès administratif attribué au compte vérifié.');
} finally { await pool.end(); }
