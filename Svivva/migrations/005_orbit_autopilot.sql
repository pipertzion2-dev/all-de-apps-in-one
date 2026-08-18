-- Orbit autopilot runs (Phase 10)
-- Audit log for autonomous/assisted recommendation execution.

CREATE TABLE IF NOT EXISTS orbit_autopilot_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  recommendations_seen INTEGER NOT NULL DEFAULT 0,
  recommendations_applied INTEGER NOT NULL DEFAULT 0,
  recommendations_skipped INTEGER NOT NULL DEFAULT 0,
  actions JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_autopilot_runs_project ON orbit_autopilot_runs(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_autopilot_runs_created ON orbit_autopilot_runs(created_at);
