-- Migration: 002_create_skin_analysis.sql
-- Skin analysis related tables

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Skin analysis results table
CREATE TABLE IF NOT EXISTS skin_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    skin_tone_hex VARCHAR(10),
    undertone VARCHAR(50),
    season VARCHAR(50),
    contrast_level VARCHAR(50),
    analysis_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skin_analysis_user_id ON skin_analysis(user_id);
CREATE INDEX idx_skin_analysis_created_at ON skin_analysis(created_at DESC);

-- Skin recommendations table
CREATE TABLE IF NOT EXISTS skin_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES skin_analysis(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'lipstick', 'eyeshadow', 'clothing', etc.
    recommended_colors JSONB NOT NULL,
    recommended_products JSONB DEFAULT '[]',
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skin_recommendations_user_id ON skin_recommendations(user_id);
CREATE INDEX idx_skin_recommendations_analysis_id ON skin_recommendations(analysis_id);
