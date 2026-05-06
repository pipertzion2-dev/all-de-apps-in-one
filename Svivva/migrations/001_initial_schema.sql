-- PromptAPI Database Schema Migration
-- Version: 001
-- Description: Initial schema with users, projects, versions, training, evals, and deployments

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- PROJECTS (API definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  output_schema JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- ============================================================================
-- PROJECT VERSIONS (immutable snapshots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  output_schema JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_version ON project_versions(project_id, version DESC);

-- ============================================================================
-- TRAINING EXAMPLES (few-shot examples per version)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_examples (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  version_id TEXT NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  output JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_examples_version_id ON training_examples(version_id);
CREATE INDEX IF NOT EXISTS idx_training_examples_sort ON training_examples(version_id, sort_order);

-- ============================================================================
-- EVAL SUITES (groups of test cases)
-- ============================================================================
CREATE TABLE IF NOT EXISTS eval_suites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_eval_suites_project_id ON eval_suites(project_id);

-- ============================================================================
-- EVAL CASES (individual test cases)
-- ============================================================================
CREATE TABLE IF NOT EXISTS eval_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  suite_id TEXT NOT NULL REFERENCES eval_suites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input TEXT NOT NULL,
  expected_output JSONB,
  assertion_type TEXT NOT NULL DEFAULT 'exact' CHECK (assertion_type IN ('exact', 'contains', 'schema', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(suite_id, name)
);

CREATE INDEX IF NOT EXISTS idx_eval_cases_suite_id ON eval_cases(suite_id);
CREATE INDEX IF NOT EXISTS idx_eval_cases_active ON eval_cases(suite_id, is_active) WHERE is_active = true;

-- ============================================================================
-- EVAL RUNS (execution results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS eval_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  suite_id TEXT NOT NULL REFERENCES eval_suites(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_cases INTEGER NOT NULL DEFAULT 0,
  passed_cases INTEGER NOT NULL DEFAULT 0,
  failed_cases INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_suite_id ON eval_runs(suite_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_version_id ON eval_runs(version_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_status ON eval_runs(status);
CREATE INDEX IF NOT EXISTS idx_eval_runs_latest ON eval_runs(suite_id, created_at DESC);

-- ============================================================================
-- EVAL RUN RESULTS (individual case results within a run)
-- ============================================================================
CREATE TABLE IF NOT EXISTS eval_run_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES eval_cases(id) ON DELETE CASCADE,
  actual_output JSONB,
  passed BOOLEAN,
  error TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_run_results_run_id ON eval_run_results(run_id);
CREATE INDEX IF NOT EXISTS idx_eval_run_results_case_id ON eval_run_results(case_id);

-- ============================================================================
-- DEPLOYMENTS (active version pointer per project)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  deployed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  deployed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_version_id ON deployments(version_id);
CREATE INDEX IF NOT EXISTS idx_deployments_active ON deployments(project_id, is_active) WHERE is_active = true;

-- ============================================================================
-- API KEYS (for project access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(project_id, is_active) WHERE is_active = true;

-- ============================================================================
-- USAGE LOGS (API call tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id TEXT REFERENCES project_versions(id) ON DELETE SET NULL,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  input TEXT,
  output JSONB,
  latency_ms INTEGER,
  tokens_used INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_project_id ON usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_time ON usage_logs(project_id, created_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eval_suites_updated_at ON eval_suites;
CREATE TRIGGER update_eval_suites_updated_at
  BEFORE UPDATE ON eval_suites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
