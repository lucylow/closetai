-- AI Aging Features: Skin Diagnostic Analysis Schema
-- Integrates with Perfect/YouCam APIs for skin aging analysis
-- Run with: psql $DATABASE_URL -f migrations/009_aging_features.sql

-- Add parental consent columns to users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'parental_consent_given'
  ) THEN
    ALTER TABLE users ADD COLUMN parental_consent_given BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'parental_consent_email'
  ) THEN
    ALTER TABLE users ADD COLUMN parental_consent_email TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE users ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- AGING JOBS TABLE - Tracks all aging analysis jobs
CREATE TABLE IF NOT EXISTS aging_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  params JSONB NOT NULL DEFAULT '{}',
  result_keys JSONB,
  metadata JSONB DEFAULT '{}',
  credits_consumed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_jobs_status ON aging_jobs(status);
CREATE INDEX IF NOT EXISTS idx_aging_jobs_user_id ON aging_jobs(user_id);

-- AGING REPORTS TABLE - Stores computed aging metrics
CREATE TABLE IF NOT EXISTS aging_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES aging_jobs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  wrinkle_index NUMERIC(5,4),
  pore_index NUMERIC(5,4),
  pigment_index NUMERIC(5,4),
  hydration_index NUMERIC(5,4),
  elasticity_proxy NUMERIC(5,4),
  uv_damage_score NUMERIC(5,4),
  texture_irregularity NUMERIC(5,4),
  estimated_appearance_age INTEGER,
  confidence_lower INTEGER,
  confidence_upper INTEGER,
  raw_metrics JSONB,
  overlay_urls JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_reports_job_id ON aging_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_aging_reports_user_id ON aging_reports(user_id);

-- CONSENT RECORDS TABLE - Tracks user consent for data processing
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES aging_jobs(id) ON DELETE SET NULL,
  consent_type VARCHAR(50) NOT NULL,
  consent_text TEXT NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  parental_consent BOOLEAN DEFAULT false,
  parental_consenter_email TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_job_id ON consent_records(job_id);

-- AGING FEEDBACK TABLE - User feedback on aging results
CREATE TABLE IF NOT EXISTS aging_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES aging_jobs(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  liked BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_feedback_job_id ON aging_feedback(job_id);

-- AGING SIMULATIONS TABLE - Stores aging simulation results
CREATE TABLE IF NOT EXISTS aging_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES aging_jobs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  src_key VARCHAR(500),
  result_key VARCHAR(500),
  years_delta INTEGER NOT NULL,
  direction VARCHAR(20) NOT NULL,
  thumbnail_key VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_simulations_job_id ON aging_simulations(job_id);

-- PRODUCT RECOMMENDATIONS TABLE - Maps diagnostics to product suggestions
CREATE TABLE IF NOT EXISTS aging_product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES aging_reports(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL,
  product_name TEXT NOT NULL,
  brand VARCHAR(100),
  sku VARCHAR(100),
  recommendation_reason TEXT,
  confidence_score NUMERIC(3,2),
  is_medical BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGING JOB ERRORS TABLE - Detailed error logging
CREATE TABLE IF NOT EXISTS aging_job_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES aging_jobs(id) ON DELETE SET NULL,
  error_code VARCHAR(50),
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGING CREDITS USAGE TABLE - Track credit consumption
CREATE TABLE IF NOT EXISTS aging_credits_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  job_type VARCHAR(50) NOT NULL,
  credits_consumed INTEGER NOT NULL,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_credits_usage_user_id ON aging_credits_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_aging_credits_usage_created_at ON aging_credits_usage(created_at);
