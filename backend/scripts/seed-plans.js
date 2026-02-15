#!/usr/bin/env node
/**
 * Seed plans and usage_quotas. Run after migrations.
 * Usage: node scripts/seed-plans.js
 */
require('dotenv').config();
const db = require('../lib/db');

async function seed() {
  await db.query(`
    INSERT INTO plans (stripe_price_id, handle, name, unit_price_cents, billing_interval)
    VALUES
      ('price_starter_monthly', 'starter', 'Starter', 999, 'month'),
      ('price_pro_monthly', 'pro', 'Pro', 1999, 'month'),
      ('price_enterprise_monthly', 'enterprise', 'Enterprise', 4999, 'month')
    ON CONFLICT (stripe_price_id) DO NOTHING
  `);

  const planRes = await db.query(`SELECT id, handle FROM plans`);
  const metrics = ['vton_calls', 'ai_generations', 'api_calls'];
  for (const plan of planRes.rows) {
    const limits = plan.handle === 'enterprise' ? 10000 : plan.handle === 'pro' ? 500 : 50;
    for (const metric of metrics) {
      await db.query(`
        INSERT INTO usage_quotas (plan_id, metric, limit_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (plan_id, metric) DO UPDATE SET limit_value = EXCLUDED.limit_value
      `, [plan.id, metric, limits]);
    }
  }

  console.log('Plans and usage_quotas seeded');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
