/**
 * Raw SQL query helper for billing/usage tables.
 * Uses pg Pool for $1, $2 parameterized queries.
 */
const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
