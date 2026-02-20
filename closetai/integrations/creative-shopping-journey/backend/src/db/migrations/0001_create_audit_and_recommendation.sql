-- Migration: Create audit_logs and saved_recommendations tables for Creative Shopping Journey

-- Audit logs table for tracking API requests
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    params JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved recommendations table
CREATE TABLE IF NOT EXISTS saved_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recommendation_id)
);

-- Index for audit logs query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Index for saved recommendations
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_user_id ON saved_recommendations(user_id);