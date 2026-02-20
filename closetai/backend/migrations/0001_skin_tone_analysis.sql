-- PerfectCorp Skin Tone Analysis Migration
-- Creates tables for skin tone analysis integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- File Artifacts Table
-- Stores uploaded images with their hash values for deduplication
CREATE TABLE IF NOT EXISTS file_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sha256 VARCHAR(64) NOT NULL,
    p_hash VARCHAR(64),
    storage_path VARCHAR(512) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skin Tasks Table
-- Tracks analysis tasks sent to PerfectCorp
CREATE TABLE IF NOT EXISTS skin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_artifact_id UUID REFERENCES file_artifacts(id) ON DELETE CASCADE,
    perfect_task_id VARCHAR(255),
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('sd', 'hd')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
    params JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skin Analysis Results Table
-- Stores normalized skin tone analysis results
CREATE TABLE IF NOT EXISTS skin_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    skin_task_id UUID REFERENCES skin_tasks(id) ON DELETE CASCADE,
    result JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
    consent_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Palettes Table
-- Stores computed and manual color palettes
CREATE TABLE IF NOT EXISTS palettes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skin_analysis_id UUID REFERENCES skin_analysis(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    colors JSONB NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('computed', 'manual', 'sponsor')),
    score DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Consents Table
-- Tracks consent for skin analysis processing
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_version VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL DEFAULT 'skin_tone_analysis',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE(user_id, consent_type, consent_version)
);

-- Audit Logs Table
-- Tracks all actions for compliance and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    object_type VARCHAR(100