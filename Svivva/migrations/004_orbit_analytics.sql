-- Orbit analytics + recommendations (Phase 9)
-- Normalized events from distribution, indexing, content validation, and external sources.

CREATE TABLE IF NOT EXISTS orbit_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  orbit_campaign_id TEXT REFERENCES orbit_campaigns(id) ON DELETE SET NULL,
  content_asset_id TEXT REFERENCES orbit_content_assets(id) ON DELETE SET NULL,
  distribution_job_id TEXT,
  index_record_id TEXT,
  route_id TEXT,
  entity_id TEXT,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal',
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  idempotency_key TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orbit_events_idempotency ON orbit_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orbit_events_project ON orbit_events(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_events_campaign ON orbit_events(orbit_campaign_id);
CREATE INDEX IF NOT EXISTS idx_orbit_events_type ON orbit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_orbit_events_occurred ON orbit_events(occurred_at);

CREATE TABLE IF NOT EXISTS orbit_recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  orbit_campaign_id TEXT REFERENCES orbit_campaigns(id) ON DELETE SET NULL,
  trigger_event_id TEXT REFERENCES orbit_events(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orbit_recommendations_project ON orbit_recommendations(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_recommendations_campaign ON orbit_recommendations(orbit_campaign_id);
CREATE INDEX IF NOT EXISTS idx_orbit_recommendations_status ON orbit_recommendations(status);
