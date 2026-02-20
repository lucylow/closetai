-- AR Try-On Migration for PerfectCorp Integration
-- Run: psql -d closetai -f 007_create_ar_tryon.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- File artifacts table (stores uploaded images)
CREATE TABLE IF NOT EXISTS file_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sha256 VARCHAR(64) UNIQUE,
  p_hash VARCHAR(64),
  storage_path TEXT NOT NULL,
  content_type VARCHAR(100),
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR tasks table (tracks PerfectCorp tasks)
CREATE TABLE IF NOT EXISTS ar_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_artifact_id UUID REFERENCES file_artifacts(id) ON DELETE SET NULL,
  perfect_task_id VARCHAR(255) UNIQUE,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR results table (normalized results)
CREATE TABLE IF NOT EXISTS ar_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ar_task_id UUID REFERENCES ar_tasks(id) ON DELETE SET NULL,
  result JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  consent_version VARCHAR(50),
  consent_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for PII operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_artifacts_sha256 ON file_artifacts(sha256);
CREATE INDEX IF NOT EXISTS idx_ar_tasks_perfect_task_id ON