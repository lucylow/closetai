import { Pool } from 'pg';
import { DATABASE_URL } from './lib/env';
const pool = new Pool({ connectionString: DATABASE_URL });
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
  end: () => pool.end()
};
