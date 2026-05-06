import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS apex_call_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_id TEXT REFERENCES project_versions(id) ON DELETE SET NULL,
      input TEXT NOT NULL,
      output JSONB,
      latency_ms INTEGER NOT NULL,
      schema_valid BOOLEAN NOT NULL DEFAULT true,
      repaired BOOLEAN NOT NULL DEFAULT false,
      error_type TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('apex_call_logs OK');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS apex_cycles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'running',
      failure_pattern TEXT,
      sample_inputs JSONB,
      prompt_before TEXT NOT NULL,
      prompt_after TEXT,
      score_before INTEGER,
      score_after INTEGER,
      cases_run INTEGER NOT NULL DEFAULT 0,
      promoted BOOLEAN NOT NULL DEFAULT false,
      rolled_back BOOLEAN NOT NULL DEFAULT false,
      skip_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('apex_cycles OK');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
