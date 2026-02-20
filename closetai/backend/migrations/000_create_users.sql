-- Migration: 000_create_users.sql
-- Core users table for ClosetAI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    brand_id UUID, -- REFERENCES brands(id), -- commented out - brands table created later
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'designer', 'viewer')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_brand_id ON users(brand_id);
