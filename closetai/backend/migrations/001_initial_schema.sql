-- backend/migrations/001_initial_schema.sql
-- Basic schema: tenants, users, gen_jobs, job_feedback, api_usage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE gen_jobs (
  id text PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  tenant_id uuid REFERENCES tenants(id),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  params jsonb,
  result_keys jsonb,
  metadata jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_gen_jobs_tenant_status ON gen_jobs (tenant_id, status);
CREATE TABLE job_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id text REFERENCES gen_jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  rating integer,
  tags jsonb,
  comment text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE api_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id),
  endpoint text,
  cost numeric,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE credits_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES users(id),
  change numeric NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);
