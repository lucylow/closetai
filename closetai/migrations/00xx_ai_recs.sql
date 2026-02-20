-- migrations/00xx_ai_recs.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  preferences jsonb,
  created_by text
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text UNIQUE,
  owner_user_id uuid REFERENCES users(id),
  title text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id),
  vector float8[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  vector float8[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  item_id uuid REFERENCES items(id),
  event_type text, -- view, save, tryon, purchase
  value numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  version text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

COMMIT;
