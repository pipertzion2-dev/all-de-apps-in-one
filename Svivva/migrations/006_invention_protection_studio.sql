-- Invention Protection Studio (Poor Man Protection / Cube Protect)
-- Private-by-default invention documentation entities.

CREATE TABLE IF NOT EXISTS inventions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'draft',
  current_version INTEGER NOT NULL DEFAULT 1,
  documentation_progress INTEGER NOT NULL DEFAULT 0,
  conception_date TEXT,
  problem_solved TEXT,
  how_it_works TEXT,
  unique_features TEXT,
  technical_specs TEXT,
  materials TEXT,
  components_text TEXT,
  alternative_implementations TEXT,
  prototype_status TEXT NOT NULL DEFAULT 'concept',
  development_history TEXT,
  privacy TEXT NOT NULL DEFAULT 'private',
  fields_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventions_user_id_idx ON inventions(user_id);

CREATE TABLE IF NOT EXISTS invention_inventors (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'sole_inventor',
  contribution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_versions (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  label TEXT NOT NULL,
  fields_json JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_evidence (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'hashed',
  storage_key TEXT,
  notes TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_components (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'box',
  dimensions_json JSONB NOT NULL,
  position_json JSONB NOT NULL,
  rotation_json JSONB NOT NULL,
  material TEXT NOT NULL DEFAULT 'aluminum',
  callout_number INTEGER,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_timeline_events (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  kind TEXT NOT NULL,
  hash TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_collaborators (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_witnesses (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  statement TEXT,
  witnessed_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_verification_records (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  evidence_id TEXT,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invention_audit_events (
  id TEXT PRIMARY KEY,
  invention_id TEXT NOT NULL REFERENCES inventions(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  detail TEXT,
  prev_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
