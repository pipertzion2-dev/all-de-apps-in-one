-- Svivva Play tables (required for analyze → generate → export)

CREATE TABLE IF NOT EXISTS play_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL DEFAULT 'Untitled Session',
  mode TEXT NOT NULL DEFAULT 'composition',
  status TEXT NOT NULL DEFAULT 'draft',
  source_audio_url TEXT,
  source_audio_name TEXT,
  source_audio_duration INTEGER,
  analysis_id TEXT,
  style_preset TEXT,
  user_prompt TEXT,
  settings JSONB,
  seed INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS play_analyses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  bpm INTEGER,
  time_signature TEXT,
  key TEXT,
  key_confidence INTEGER,
  chords JSONB,
  sections JSONB,
  downbeats JSONB,
  style_compatibility JSONB,
  timbre_descriptors JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS play_generations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  plan JSONB,
  midi_data JSONB,
  render_quality TEXT NOT NULL DEFAULT 'preview',
  version INTEGER NOT NULL DEFAULT 1,
  seed INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS play_stems (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES play_generations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'melody',
  instrument_hint TEXT,
  audio_url TEXT,
  midi_events JSONB,
  pan INTEGER NOT NULL DEFAULT 0,
  gain_db INTEGER NOT NULL DEFAULT 0,
  muted BOOLEAN NOT NULL DEFAULT FALSE,
  soloed BOOLEAN NOT NULL DEFAULT FALSE,
  expression JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS play_patches (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Patch',
  synth_family TEXT,
  patch_data JSONB,
  instructions TEXT,
  macros JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_play_analyses_session ON play_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_play_generations_session ON play_generations(session_id);
CREATE INDEX IF NOT EXISTS idx_play_stems_generation ON play_stems(generation_id);
