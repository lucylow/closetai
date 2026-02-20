-- Migration: 003_create_gen_tables.sql
-- Tables: gen_jobs, prompts, api_usage
-- Run via: psql $DATABASE_URL -f 003_create_gen_tables.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: gen_jobs
-- Stores generation job metadata and results
CREATE TABLE IF NOT EXISTS gen_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'text2img', 'edit', 'tryon', 'batch'
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    prompt TEXT,
    metadata JSONB DEFAULT '{}',
    result_key TEXT, -- S3 key for the generated image
    input_key TEXT, -- S3 key for input image (for edit/tryon)
    style VARCHAR(100),
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    seed INTEGER,
    credits_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index for faster user job lookups
CREATE INDEX IF NOT EXISTS idx_gen_jobs_user_id ON gen_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON gen_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_type ON gen_jobs(type);
CREATE INDEX IF NOT EXISTS idx_gen_jobs_created_at ON gen_jobs(created_at DESC);

-- Table: prompts
-- Stores prompt templates and user prompts for audit and reuse
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    template VARCHAR(100), -- 'hero_product', 'lookbook', 'social_promo', etc.
    style VARCHAR(100),
    variables JSONB DEFAULT '{}', -- Store template variables
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_template ON prompts(template);

-- Table: api_usage
-- Tracks API usage for billing and audit
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- 'perfect', 'openai', etc.
    api_key_hash TEXT, -- Hash of API key used (for audit)
    endpoint VARCHAR(255), -- API endpoint called
    header_values JSONB DEFAULT '{}', -- Response headers (credits, etc.)
    credits_before INTEGER,
    credits_after INTEGER,
    credits_used INTEGER,
    job_id UUID REFERENCES gen_jobs(id),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    request_payload JSONB, -- Sanitized request (no PII)
    response_payload JSONB, -- Sanitized response
    status_code INTEGER,
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_job_id ON api_usage(job_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Table: creative_journeys
-- Stores multi-step creative shopping journeys
CREATE TABLE IF NOT EXISTS creative_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'product_shoot', 'lookbook', 'social_campaign'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'processing', 'completed', 'failed'
    steps JSONB DEFAULT '[]', -- Array of journey steps
    jobs UUID[], -- Array of gen_job IDs
    result_keys TEXT[], -- Array of result S3 keys
    is_shared BOOLEAN DEFAULT FALSE,
    share_token UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_creative_journeys_user_id ON creative_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_journeys_status ON creative_journeys(status);
