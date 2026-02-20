-- PerfectCorp Hair Integration Migration
-- Run this to create tables for hair analysis and task tracking

BEGIN;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- File artifacts table - stores uploaded images with deduplication
CREATE TABLE IF NOT EXISTS file_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sha256 TEXT UNIQUE,
    p_hash TEXT,
    storage_path TEXT,
    content_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hair tasks table - tracks PerfectCorp task status
CREATE TABLE IF NOT EXISTS hair_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    file_artifact_id UUID REFERENCES file_artifacts(id),
    perfect_task_id TEXT,
    task_type TEXT, -- hair_color_tryon, hairstyle_generation, hair_type_detection, etc.
    status TEXT DEFAULT 'pending',
    params JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hair analysis results table - stores normalized analysis results
CREATE TABLE IF NOT EXISTS hair_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    hair_task_id UUID REFERENCES hair_tasks(id),
    result JSONB,
    status TEXT DEFAULT 'pending',
    consent_version TEXT,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table - for compliance and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID,
    object_type TEXT,
    object_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User consent records
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    consent_type TEXT NOT NULL, -- hair_analysis, face_photo, etc.
    consent_version TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT true,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product recommendations cache
CREATE TABLE IF NOT EXISTS hair_product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hair_analysis_id UUID REFERENCES hair_analysis(id),
    product_type TEXT NOT NULL, -- wig, extension, dye, accessory
    product_sku TEXT NOT NULL,
    product_name TEXT,
    match_score DECIMAL(5,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_sha256 ON file_artifacts(sha256);
CREATE INDEX IF NOT EXISTS idx_file_p_hash ON file_artifacts(p_hash);
CREATE INDEX IF NOT EXISTS idx_hair_task_perfect_task_id ON hair_tasks(perfect_task_id);
CREATE INDEX IF NOT EXISTS idx_hair_task_status ON hair_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hair_task_user_id ON hair_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_hair_analysis_user_id ON hair_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_hair_analysis_task_id ON hair_analysis(hair_task_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

COMMIT;
