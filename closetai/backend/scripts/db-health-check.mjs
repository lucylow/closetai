import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5000,
});

try {
  const { rows } = await pool.query('SELECT 1 AS ok, now() AS server_time');
  console.log('DB health check passed:', rows[0]);

  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log(`Found ${tables.rows.length} tables:`,
    tables.rows.map(r => r.table_name).join(', '));
} catch (err) {
  console.error('DB health check FAILED:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
