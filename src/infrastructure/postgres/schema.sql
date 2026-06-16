-- CSV Insight — PostgreSQL schema. Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL
);

CREATE TABLE IF NOT EXISTS datasets (
  id          text PRIMARY KEY,
  user_id     text NOT NULL,
  owner_email text NOT NULL,
  filename    text NOT NULL,
  columns     jsonb NOT NULL,
  row_count   int NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rows (
  id         text PRIMARY KEY,
  dataset_id text NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  data       jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at);
CREATE INDEX IF NOT EXISTS idx_rows_dataset_id ON rows(dataset_id);

-- Seed the demo admin: sha256('demo1234').
INSERT INTO users (id, email, password_hash, role)
VALUES (
  'u_admin',
  'admin@demo.test',
  '0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d',
  'admin'
)
ON CONFLICT (id) DO NOTHING;
