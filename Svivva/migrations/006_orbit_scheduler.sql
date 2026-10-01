-- Orbit production scheduler runs (Phase 11)

CREATE TABLE IF NOT EXISTS orbit_scheduler_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'completed',
  projects_seen INTEGER NOT NULL DEFAULT 0,
  projects_processed INTEGER NOT NULL DEFAULT 0,
  index_recheck JSONB DEFAULT '{}'::jsonb,
  distribution JSONB DEFAULT '{}'::jsonb,
  project_results JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_scheduler_runs_created ON orbit_scheduler_runs(created_at);
