-- migrations/000_create_users.sql
-- Create users table for CI (Sequelize creates this in dev). Idempotent.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  password text,
  full_name text,
  auth_method text DEFAULT 'email',
  style_preferences jsonb DEFAULT '{}',
  measurements jsonb,
  role text DEFAULT 'user',
  plan text DEFAULT 'free',
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
