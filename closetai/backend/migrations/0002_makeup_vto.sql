-- PerfectCorp Makeup VTO Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE makeup_file_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_id VARCHAR(255),
    storage_path VARCHAR(512) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 VARCHAR(64),
    original_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE makeup_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_artifact_id UUID REFERENCES makeup_file_artifacts(id) ON DELETE CASCADE,
    perfect_task_id VARCHAR(255),
    task_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    params JSONB,
    effects JSONB,
    template_id VARCHAR(255),
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE makeup_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    makeup_task_id UUID REFERENCES makeup_tasks(id) ON DELETE CASCADE,
    result JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    consent_version VARCHAR(50),
    original_image_url TEXT,
    composite_image_url TEXT,
    raw_provider_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE makeup_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    thumbnail_url TEXT,
    effects JSONB,
    is_premium BOOLEAN DEFAULT false,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE makeup_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_version VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL DEFAULT 'makeup_vto',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT
