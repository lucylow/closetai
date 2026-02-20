-- Migration: 008_create_wardrobe_features.sql
-- Wardrobe items, outfits, recommendations, embeddings, and try-on artifacts
-- Run with: psql $DATABASE_URL -f migrations/008_create_wardrobe_features.sql

BEGIN;

-- ============================================================================
-- WARDROBE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT, -- e.g., top, bottom, outerwear, shoes, accessory
  color TEXT[],
  tags TEXT[],
  attributes JSONB, -- size, brand, fabric, etc
  embedding_id UUID, -- references embeddings table
  last_worn TIMESTAMPTZ,
  wear_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for wardrobe_items
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON wardrobe_items(category);

-- ============================================================================
-- OUTFITS (saved combinations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  item_ids UUID[] NOT NULL, -- array of wardrobe_items ids
  cover_image TEXT, -- generated composite image
  occasion TEXT, -- e.g., casual, formal
  score FLOAT, -- system or user rating
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);

-- ============================================================================
-- RECOMMENDATION AUDIT EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'recommendation_shown', 'recommended_clicked', 'saved', 'dismissed'
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_user_id ON recommendation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_created_at ON recommendation_events(created_at);

-- ============================================================================
-- EMBEDDINGS STORE
-- ============================================================================
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vector FLOAT8[],
  source TEXT, -- 'wardrobe', 'generated', 'external'
  source_id UUID, -- id linking to wardrobe_items or outfits
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source_id ON embeddings(source_id);

-- ============================================================================
-- TRY-ON ARTIFACTS CACHE METADATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS tryon_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL, -- cache key
  image_url TEXT NOT NULL,
  sponsor TEXT, -- e.g., 'perfectcorp' or 'local'
  params JSONB, -- parameters used to generate tryon
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tryon_artifacts_user_id ON tryon_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_artifacts_expires_at ON tryon_artifacts(expires_at);

COMMIT;