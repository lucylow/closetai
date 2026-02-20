-- migrations/00xx_data_sources.sql
-- Data sources and ingestion schema for ClosetAI
-- This migration creates tables for datasets, files, ingestion jobs, artifacts, embeddings, annotations, and audit logs

BEGIN;

-- Datasets manifest table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  source_type text,
  license text,
  license_url text,
  contact text,
  manifest jsonb,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Source files discovered for dataset
CREATE TABLE IF NOT EXISTS dataset_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  path text NOT NULL,
  file_type text,
  size_bytes bigint,
  sha256 text,
  p_hash text,
  metadata jsonb,
  ingestion_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Ingestion jobs
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE SET NULL,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  stats jsonb,
  errors jsonb,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Artifacts (processed files)
CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_file_id uuid REFERENCES dataset_files(id) ON DELETE CASCADE,
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  storage_path text,
  variant text,
  width int,
  height int,
  metadata jsonb,
  provenance jsonb,
  created_at timestamptz DEFAULT now()
);

-- Embeddings (demo: float8[] vector, for production use vector DB)
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  source_id uuid,
  vector float8[],
  model_name text,
  created_at timestamptz DEFAULT now()
);

-- Annotations & labeling
CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid REFERENCES artifacts(id) ON DELETE CASCADE,
  annotator_id text,
  labels jsonb,
  confidence numeric,
  time_spent_seconds int,
  created_at timestamptz DEFAULT now()
);

-- Audit logs for provenance and transformations
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid,
  dataset_id uuid,
  ingestion_job_id uuid,
  action text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Annotation queue for active learning
CREATE TABLE IF NOT EXISTS annotation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid REFERENCES artifacts(id) ON DELETE CASCADE,
  priority int DEFAULT 0,
  sampling_strategy text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  annotated_at timestamptz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dataset_files_dataset_id ON dataset_files(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_files_sha256 ON dataset_files(sha256);
CREATE INDEX IF NOT EXISTS idx_dataset_files_p_hash ON dataset_files(p_hash);
CREATE INDEX IF NOT EXISTS idx_artifacts_dataset_id ON artifacts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_dataset_file_id ON artifacts(dataset_file_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source, source_id);
CREATE INDEX IF NOT EXISTS idx_annotations_artifact_id ON annotations(artifact_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_artifact_id ON audit_logs(artifact_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dataset_id ON audit_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_annotation_queue_status ON annotation_queue(status, priority);

COMMIT;
