#!/usr/bin/env node
/**
 * Seed plans and usage_quotas. Run after migrations.
 * Usage: DATABASE_URL=postgres://... node scripts/seedPlans.js
 * CI-friendly: explicit plan/limit definitions, no magic Stripe config.
 */
require('dotenv').config();
const { Client } = require('pg');

const plans = [
  {
    handle: 'starter',
    name: 'Starter',
    stripe_price_id: 'price_starter_123',
    unit_price_cents: 1999,
    billing_interval: 'month',
    quotas: {
      api_calls: 500,
      ai_generations: 50,
      vton_calls: 10,
    },
  },
  {
    handle: 'pro',
    name: 'Pro',
    stripe_price_id: 'price_pro_123',
    unit_price_cents: 4999,
    billing_interval: 'month',
    quotas: {
      api_calls: 5000,
      ai_generations: 500,
      vton_calls: 100,
    },
  },
];

async function run() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

  const client = new Client({ connectionString });
  await client.connect();

  for (const plan of plans) {
    const planRes = await client.query(
      `
      INSERT INTO plans (handle, name, stripe_price_id, unit_price_cents, billing_interval)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (stripe_price_id) DO UPDATE
      SET name = EXCLUDED.name, unit_price_cents = EXCLUDED.unit_price_cents
      RETURNING id
      `,
      [plan.handle, plan.name, plan.stripe_price_id, plan.unit_price_cents, plan.billing_interval]
    );

    const planId = planRes.rows[0].id;

    for (const [metric, limit] of Object.entries(plan.quotas)) {
      await client.query(
        `
        INSERT INTO usage_quotas (plan_id, metric, limit_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (plan_id, metric)
        DO UPDATE SET limit_value = EXCLUDED.limit_value
        `,
        [planId, metric, limit]
      );
    }
  }

  await client.end();
  console.log('Plans and quotas seeded');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
