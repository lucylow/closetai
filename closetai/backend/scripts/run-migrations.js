#!/usr/bin/env node
/**
 * Run SQL migrations. Usage: node scripts/run-migrations.js
 * Requires: DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const env = require('../config/env');
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${env.db.user}:${env.db.password}@${env.db.host}:${env.db.port}/${env.db.name}`;

const pool = new Pool({ connectionString });
const migrationsDir = path.join(__dirname, '../migrations');

async function run() {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
    console.log(`  Done`);
  }
  await pool.end();
  console.log('Migrations complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
