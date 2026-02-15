-- migrations/001_create_billing_and_usage.sql
-- Billing, usage tracking, and quota enforcement schema for ClosetAI.
-- Run with: psql $DATABASE_URL -f migrations/001_create_billing_and_usage.sql

-- Add stripe_customer_id to users (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Plans table (mirror of Stripe price ids / SKU)
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  handle text UNIQUE NOT NULL,
  name text NOT NULL,
  unit_price_cents int NOT NULL,
  billing_interval text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions (local mapping to Stripe subscription)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_item_id text,
  plan_id uuid REFERENCES plans(id),
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Usage buckets / counters per period
CREATE TABLE IF NOT EXISTS usage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
  metric text NOT NULL,
  limit_value bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, metric)
);

-- Reported usage events (raw)
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value bigint NOT NULL DEFAULT 1,
  incurred_at timestamptz NOT NULL DEFAULT now(),
  reported_by text,
  stripe_reported boolean DEFAULT false,
  stripe_usage_record_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_metric ON usage_events(user_id, metric);
CREATE INDEX IF NOT EXISTS idx_usage_events_incurred ON usage_events(incurred_at);

-- Aggregated usage per billing period (for quick checks)
CREATE TABLE IF NOT EXISTS usage_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  metric text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_value bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_aggregates_user_period ON usage_aggregates(user_id, metric, period_start);

-- Admin overrides (allow granting extra quota)
CREATE TABLE IF NOT EXISTS quota_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  metric text NOT NULL,
  extra bigint NOT NULL DEFAULT 0,
  expires_at timestamptz,
  reason text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric)
);
