-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- File Artifacts Table
-- ============================================
CREATE TABLE IF NOT EXISTS file_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sha256 VARCHAR(64) UNIQUE NOT NULL,
    p_hash VARCHAR(64),
    storage_path VARCHAR(512) NOT NULL,
    content_type VARCHAR(100),
    size_bytes INTEGER,
    original_filename VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_artifacts_sha256 ON file_artifacts(sha256);

-- ============================================
-- AR Jewelry Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS ar_jewelry_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_artifact_id UUID REFERENCES file_artifacts(id) ON DELETE SET NULL,
    perfect_task_id VARCHAR(255),
    task_type VARCHAR(50) NOT NULL,
    params JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_jewelry_tasks_status ON ar_jewelry_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ar_jewelry_tasks_perfect_task_id ON ar_jewelry_tasks(perfect_task_id);

-- ============================================
-- AR Jewelry Results Table
-- ============================================
CREATE TABLE IF NOT EXISTS ar_jewelry_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ar_task_id UUID REFERENCES ar_jewelry_tasks(id) ON DELETE SET NULL,
    result JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    consent_version VARCHAR(50),
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_jewelry_results_status ON ar_jewelry_results(status);
CREATE INDEX IF NOT EXISTS idx_ar_jewelry_results_user_id ON ar_jewelry_results(user_id);

-- ============================================
-- Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    object_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);