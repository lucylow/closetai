-- ClosetAI – Production-Ready PostgreSQL Schema
-- Migration: 001_init.sql
-- Run: psql "$DATABASE_URL" -f db/migrations/001_init.sql
-- This is an idempotent migration – safe to re-run.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE item_category AS ENUM (
    'tops', 'bottoms', 'dresses', 'outerwear',
    'shoes', 'accessories', 'jewelry', 'bags', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active', 'past_due', 'canceled', 'trialing'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anon_id         TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE,
  display_name    VARCHAR(255),
  password_hash   TEXT,
  is_brand        BOOLEAN DEFAULT FALSE,
  credits_balance INTEGER DEFAULT 25,
  credits_used    INTEGER DEFAULT 0,
  lifetime_value  NUMERIC(12,2) DEFAULT 0,
  plan            VARCHAR(50) DEFAULT 'free',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  last_login      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_anon_id ON users(anon_id);

-- ============================================================
-- BRAND ACCOUNTS (B2B tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_accounts (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_customer_id     TEXT,
  mrr                    NUMERIC(12,2) DEFAULT 0,
  arr                    NUMERIC(12,2),
  active_subscriptions   INTEGER DEFAULT 0,
  tryon_accuracy         NUMERIC(4,3) DEFAULT 0.942,
  dataset_access         BOOLEAN DEFAULT FALSE,
  custom_model_training  BOOLEAN DEFAULT FALSE,
  onboarding_complete    BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_brands_stripe ON brand_accounts(stripe_customer_id);

-- ============================================================
-- WARDROBE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    item_category NOT NULL,
  name        VARCHAR(255) NOT NULL,
  brand       VARCHAR(255),
  ai_tags     TEXT[],
  color_tags  TEXT[],
  usage_count INTEGER DEFAULT 0,
  image_key   TEXT,
  embedding   BYTEA,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_user_cat ON wardrobe_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_created ON wardrobe_items(created_at);

-- ============================================================
-- TRYON JOBS (AR virtual try-on)
-- ============================================================
CREATE TABLE IF NOT EXISTS tryon_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  brand_id       UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
  job_status     VARCHAR(20) DEFAULT 'queued',
  category       item_category,
  selfie_key     TEXT,
  garment_keys   TEXT[],
  result_key     TEXT,
  confidence     NUMERIC(4,3),
  processing_ms  INTEGER,
  device_info    JSONB,
  created_at     TIMESTAMPTZ DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tryon_user_status ON tryon_jobs(user_id, job_status);
CREATE INDEX IF NOT EXISTS idx_tryon_brand ON tryon_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_tryon_created ON tryon_jobs(created_at);

-- ============================================================
-- BRAND ANALYTICS (per-brand metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_analytics (
  brand_id          UUID PRIMARY KEY REFERENCES brand_accounts(id) ON DELETE CASCADE,
  dau               INTEGER,
  conversion_rate   NUMERIC(5,4),
  ltv               NUMERIC(12,2),
  cac               NUMERIC(12,2),
  ltv_cac_ratio     NUMERIC(8,2),
  churn_rate        NUMERIC(5,4),
  nps               INTEGER,
  dataset_sessions  BIGINT DEFAULT 0,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STRIPE SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id                     TEXT PRIMARY KEY,
  brand_id               UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
  customer_id            TEXT,
  status                 subscription_status NOT NULL,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  quantity               INTEGER DEFAULT 1,
  mrr                    NUMERIC(12,2),
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STRIPE CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USER CREDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credits (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_reset_date DATE,
  credits_granted    INTEGER DEFAULT 25,
  credits_used       INTEGER DEFAULT 0,
  credits_remaining  INTEGER GENERATED ALWAYS AS (credits_granted - credits_used) STORED,
  pro_tier_expires   TIMESTAMPTZ
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_styles TEXT[],
  preferred_colors TEXT[],
  size_info        JSONB,
  occasions        TEXT[],
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  webhook_url   TEXT,
  webhook_secret TEXT,
  preferences   JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OUTFITS
-- ============================================================
CREATE TABLE IF NOT EXISTS outfits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255),
  items       UUID[],
  occasion    VARCHAR(100),
  rating      INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OUTFIT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS outfit_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  outfit_id  UUID REFERENCES outfits(id) ON DELETE CASCADE,
  worn_date  DATE NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DRAFTS (social media content)
-- ============================================================
CREATE TABLE IF NOT EXISTS drafts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255),
  content      TEXT,
  platform     VARCHAR(50),
  status       VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STORAGE OBJECTS (object storage metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_objects (
  key          TEXT PRIMARY KEY,
  bucket       VARCHAR(100) NOT NULL DEFAULT 'closetai-wardrobe',
  content_type VARCHAR(255),
  size_bytes   BIGINT,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REVENUE ATTRIBUTION
-- ============================================================
CREATE TABLE IF NOT EXISTS revenue_attribution (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id              UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
  attribution_source    VARCHAR(100),
  revenue_usd           NUMERIC(12,2),
  sessions_contributed  INTEGER,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USER COHORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_cohorts (
  cohort_month    DATE NOT NULL,
  brand_id        UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  day_1_dau       INTEGER DEFAULT 0,
  day_7_dau       INTEGER DEFAULT 0,
  day_30_dau      INTEGER DEFAULT 0,
  retention_d7    NUMERIC(5,4),
  retention_d30   NUMERIC(5,4),
  PRIMARY KEY (cohort_month, brand_id)
);

-- ============================================================
-- AI TRAINING MODELS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_training_models (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id          UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
  model_name        VARCHAR(255) NOT NULL,
  model_type        VARCHAR(100) NOT NULL,
  status            VARCHAR(50) DEFAULT 'pending',
  accuracy          NUMERIC(5,4),
  training_sessions INTEGER DEFAULT 0,
  config            JSONB,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ANONYMIZED TRYON DATASET
-- ============================================================
CREATE TABLE IF NOT EXISTS anonymized_tryon_dataset (
  session_hash       TEXT PRIMARY KEY,
  brand_id           UUID REFERENCES brand_accounts(id) ON DELETE SET NULL,
  category           item_category,
  confidence         NUMERIC(4,3),
  device_type        VARCHAR(50),
  session_timestamp  TIMESTAMPTZ,
  duration_ms        INTEGER,
  success            BOOLEAN
);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_wardrobe_updated
    BEFORE UPDATE ON wardrobe_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- ============================================================
-- NOTES
-- ============================================================
-- Run this migration:
--   psql "$DATABASE_URL" -f db/migrations/001_init.sql
--
-- Or via npm:
--   npm run db:migrate
--
-- DATABASE_URL is automatically provided by Replit PostgreSQL.
-- Check Replit's Secrets panel to verify it's set.
