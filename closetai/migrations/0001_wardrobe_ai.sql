-- migrations/0001_wardrobe_ai.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id text UNIQUE,
  consent_version text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text UNIQUE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text,
  brand text,
  category text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  version int DEFAULT 1,
  provenance jsonb
);

CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_item_id uuid REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  storage_path text,
  sha256 text,
  p_hash text,
  width int,
  height int,
  mime text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid REFERENCES artifacts(id) ON DELETE CASCADE,
  model_name text,
  vector float8[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  method text,
  vector float8[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  item_id uuid REFERENCES wardrobe_items(id),
  event_type text,
  value numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text,
  object_id uuid,
  action text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_sha256 ON artifacts(sha256);
CREATE INDEX IF NOT EXISTS idx_artifacts_p_hash ON artifacts(p_hash);
CREATE INDEX IF NOT EXISTS idx_item_embeddings_artifact ON item_embeddings(artifact_id);

COMMIT;
