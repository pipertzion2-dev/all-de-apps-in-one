-- Orbit growth graph schema (Phase 2)
-- Additive tables for project graph, campaigns, content, distribution, indexing, OaaS routes.

-- ============================================================================
-- ORBIT PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  source_type TEXT NOT NULL,
  source_ref TEXT,
  status TEXT NOT NULL DEFAULT 'ingesting',
  normalized_summary JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ingest_error TEXT,
  ingested_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_projects_user_id ON orbit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_orbit_projects_source ON orbit_projects(source_type, source_ref);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orbit_projects_user_source
  ON orbit_projects(user_id, source_type, source_ref)
  WHERE source_ref IS NOT NULL;

-- ============================================================================
-- ORBIT ENTITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_entities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  slug TEXT,
  url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_entities_project ON orbit_entities(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_entities_type ON orbit_entities(orbit_project_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_orbit_entities_external ON orbit_entities(external_id);

-- ============================================================================
-- ORBIT ENTITY LINKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_entity_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  from_entity_id TEXT NOT NULL REFERENCES orbit_entities(id) ON DELETE CASCADE,
  to_entity_id TEXT NOT NULL REFERENCES orbit_entities(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_orbit_entity_links_project ON orbit_entity_links(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_entity_links_from ON orbit_entity_links(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_orbit_entity_links_to ON orbit_entity_links(to_entity_id);

-- ============================================================================
-- ORBIT CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marketing_campaign_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'discovery',
  mode TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft',
  objective TEXT NOT NULL DEFAULT 'traffic',
  source_channel TEXT,
  source_ref TEXT,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  approval_policy JSONB,
  plan_snapshot JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_campaigns_project ON orbit_campaigns(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_campaigns_user ON orbit_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_orbit_campaigns_status ON orbit_campaigns(status);

-- ============================================================================
-- ORBIT CONTENT ASSETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_content_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  orbit_campaign_id TEXT REFERENCES orbit_campaigns(id) ON DELETE SET NULL,
  entity_id TEXT REFERENCES orbit_entities(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  version INTEGER NOT NULL DEFAULT 1,
  parent_asset_id TEXT,
  title TEXT,
  body TEXT NOT NULL,
  body_format TEXT NOT NULL DEFAULT 'markdown',
  metadata JSONB DEFAULT '{}'::jsonb,
  prompt_template_version TEXT,
  model TEXT,
  estimated_cost_usd TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending',
  validation_results JSONB,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP,
  publish_status TEXT NOT NULL DEFAULT 'draft',
  published_url TEXT,
  published_at TIMESTAMP,
  published_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_content_assets_project ON orbit_content_assets(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_content_assets_campaign ON orbit_content_assets(orbit_campaign_id);
CREATE INDEX IF NOT EXISTS idx_orbit_content_assets_publish ON orbit_content_assets(publish_status);
CREATE INDEX IF NOT EXISTS idx_orbit_content_assets_parent ON orbit_content_assets(parent_asset_id);

-- ============================================================================
-- ORBIT DISTRIBUTION JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_distribution_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  orbit_campaign_id TEXT REFERENCES orbit_campaigns(id) ON DELETE SET NULL,
  content_asset_id TEXT NOT NULL REFERENCES orbit_content_assets(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'publish',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_distribution_jobs_asset ON orbit_distribution_jobs(content_asset_id);
CREATE INDEX IF NOT EXISTS idx_orbit_distribution_jobs_status ON orbit_distribution_jobs(status);
CREATE INDEX IF NOT EXISTS idx_orbit_distribution_jobs_provider ON orbit_distribution_jobs(provider);

-- ============================================================================
-- ORBIT INDEX RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_index_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  orbit_project_id TEXT NOT NULL REFERENCES orbit_projects(id) ON DELETE CASCADE,
  content_asset_id TEXT REFERENCES orbit_content_assets(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  canonical_url TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  provider TEXT NOT NULL DEFAULT 'indexnow',
  submitted_at TIMESTAMP,
  last_checked_at TIMESTAMP,
  next_check_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(url, provider)
);

CREATE INDEX IF NOT EXISTS idx_orbit_index_records_project ON orbit_index_records(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_index_records_status ON orbit_index_records(status);
CREATE INDEX IF NOT EXISTS idx_orbit_index_records_next_check ON orbit_index_records(next_check_at);

-- ============================================================================
-- ORBIT ROUTES (OaaS patch-bay persistence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orbit_routes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  orbit_project_id TEXT REFERENCES orbit_projects(id) ON DELETE SET NULL,
  name TEXT,
  description TEXT,
  source_channel TEXT NOT NULL,
  source_ref TEXT,
  destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  last_run_at TIMESTAMP,
  last_run_result JSONB,
  last_error TEXT,
  retry_policy JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orbit_routes_user ON orbit_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_orbit_routes_project ON orbit_routes(orbit_project_id);
CREATE INDEX IF NOT EXISTS idx_orbit_routes_status ON orbit_routes(status);
