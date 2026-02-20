-- migrations/00xx_trends.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  source_type text,
  license text,
  manifest jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE SET NULL,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  stats jsonb,
  errors jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE SET NULL,
  source text,
  source_id text,
  canonical_url text,
  title text,
  body text,
  excerpt text,
  authors jsonb,
  publish_date timestamptz,
  language text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  storage_path text,
  media_type text,
  sha256 text,
  p_hash text,
  width int,
  height int,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text UNIQUE,
  canonical_form text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES trend_topics(id) ON DELETE CASCADE,
  time_bucket timestamptz NOT NULL,
  count bigint DEFAULT 0,
  weighted_score numeric DEFAULT 0,
  components jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  source_id uuid,
  vector float8[],
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

CREATE INDEX IF NOT EXISTS idx_trend_signals_topic_time ON trend_signals(topic_id, time_bucket);
CREATE INDEX IF NOT EXISTS idx_content_items_publish_date ON content_items(publish_date);
CREATE INDEX IF NOT EXISTS idx_artifacts_sha256 ON artifacts(sha256);

COMMIT;
