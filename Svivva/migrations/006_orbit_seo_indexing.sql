-- Orbit SEO & Indexing Manager tables (workspace-aware)
-- Safe to run multiple times with IF NOT EXISTS

CREATE TABLE IF NOT EXISTS orbit_public_apps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'mini_app',
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tool_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  indexable BOOLEAN NOT NULL DEFAULT TRUE,
  sitemap_included BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,
  content_lastmod TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS orbit_public_apps_workspace_slug ON orbit_public_apps (workspace_id, slug);
CREATE INDEX IF NOT EXISTS orbit_public_apps_status_idx ON orbit_public_apps (status, is_public);

CREATE TABLE IF NOT EXISTS orbit_app_seo_config (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES orbit_public_apps(id) ON DELETE CASCADE,
  seo_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  canonical_override BOOLEAN NOT NULL DEFAULT FALSE,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  robots_directive TEXT NOT NULL DEFAULT 'index,follow',
  structured_data_json JSONB,
  crawlable_body TEXT NOT NULL DEFAULT '',
  who_its_for TEXT NOT NULL DEFAULT '',
  how_to_use TEXT NOT NULL DEFAULT '',
  key_features TEXT[] NOT NULL DEFAULT '{}',
  faq_json JSONB DEFAULT '[]',
  admin_overrides JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orbit_sitemap_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  app_id TEXT REFERENCES orbit_public_apps(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  canonical BOOLEAN NOT NULL DEFAULT TRUE,
  chunk TEXT NOT NULL DEFAULT 'apps',
  lastmod TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority REAL NOT NULL DEFAULT 0.8,
  change_frequency TEXT NOT NULL DEFAULT 'weekly',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS orbit_sitemap_entries_url ON orbit_sitemap_entries (url);
CREATE INDEX IF NOT EXISTS orbit_sitemap_entries_active_idx ON orbit_sitemap_entries (active, chunk);

CREATE TABLE IF NOT EXISTS orbit_seo_domains (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS orbit_seo_domains_ws_domain ON orbit_seo_domains (workspace_id, domain);

CREATE TABLE IF NOT EXISTS orbit_gsc_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  domain_id TEXT REFERENCES orbit_seo_domains(id) ON DELETE SET NULL,
  property_uri TEXT,
  encrypted_refresh_token TEXT,
  encrypted_access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orbit_gsc_daily_metrics (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  connection_id TEXT REFERENCES orbit_gsc_connections(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS orbit_gsc_daily_ws_date ON orbit_gsc_daily_metrics (workspace_id, date);

CREATE TABLE IF NOT EXISTS orbit_gsc_query_metrics (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  date TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS orbit_gsc_query_idx ON orbit_gsc_query_metrics (workspace_id, date);

CREATE TABLE IF NOT EXISTS orbit_gsc_page_metrics (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  date TEXT NOT NULL,
  page_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS orbit_gsc_page_idx ON orbit_gsc_page_metrics (workspace_id, date);

CREATE TABLE IF NOT EXISTS orbit_seo_audit_results (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  app_id TEXT REFERENCES orbit_public_apps(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orbit_indexing_checks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  app_id TEXT NOT NULL REFERENCES orbit_public_apps(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  sitemap_included BOOLEAN NOT NULL DEFAULT FALSE,
  crawlable BOOLEAN NOT NULL DEFAULT FALSE,
  indexable BOOLEAN NOT NULL DEFAULT FALSE,
  canonical_valid BOOLEAN NOT NULL DEFAULT FALSE,
  metadata_complete BOOLEAN NOT NULL DEFAULT FALSE,
  google_traffic_detected BOOLEAN NOT NULL DEFAULT FALSE,
  needs_attention BOOLEAN NOT NULL DEFAULT FALSE,
  attention_reasons TEXT[] NOT NULL DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orbit_seo_opportunities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  app_id TEXT REFERENCES orbit_public_apps(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  metrics JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orbit_ahrefs_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  encrypted_api_key TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'disconnected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
